import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { sendNotification } from '~/server/utils/send-notification'
import type { BadgeType } from '~/utils/staff-permissions'

interface Body {
  action?: 'approve' | 'reject' | 'assign' | 'revoke'
  requestId?: string
  kind?: 'user' | 'page'
  targetId?: string
  type?: BadgeType
  note?: string
}

const TYPES: BadgeType[] = ['personal', 'business', 'government']
const LABEL: Record<BadgeType, string> = { personal: 'individual', business: 'business', government: 'government' }

/**
 * approve/reject act on a request; assign sets or changes a badge directly;
 * revoke removes it. Targets are users or Pages.
 */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'verification')
  const body = await readBody<Body>(event)
  const service = getServiceClient()
  const now = new Date().toISOString()
  const note = body?.note?.trim().slice(0, 500) || null

  let kind = body?.kind
  let targetId = body?.targetId
  let ownerId: string | null = null

  if (body?.action === 'approve' || body?.action === 'reject') {
    const { data: request } = await service.from('badge_requests')
      .select('id, user_id, page_id, category, status').eq('id', body.requestId ?? '').maybeSingle()
    if (!request) throw createError({ statusCode: 404, statusMessage: 'Request not found' })
    if (request.status !== 'pending') throw createError({ statusCode: 409, statusMessage: 'Request already reviewed' })
    kind = request.page_id ? 'page' : 'user'
    targetId = request.page_id ?? request.user_id
    ownerId = request.user_id
    if (body.action === 'reject' && !note) throw createError({ statusCode: 400, statusMessage: 'Give the applicant a reason' })
    await service.from('badge_requests').update({
      status: body.action === 'approve' ? 'approved' : 'rejected',
      category: body.action === 'approve' ? (body.type ?? request.category) : request.category,
      review_note: note,
      reviewed_by: staff.id,
      updated_at: now
    } as never).eq('id', request.id)
    if (body.action === 'reject') {
      await logStaffAction(staff.id, 'verification_reject', kind, targetId, { requestId: request.id, note })
      await sendNotification(event, ownerId, 'system', `Your verification request was not approved: ${note}`, staff.id)
      return { success: true, status: 'rejected' }
    }
  } else if (body?.action !== 'assign' && body?.action !== 'revoke') {
    throw createError({ statusCode: 400, statusMessage: 'action must be approve, reject, assign or revoke' })
  }

  if (body.action === 'assign' && staff.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only the super admin can award a badge directly' })
  }
  if (!targetId || (kind !== 'user' && kind !== 'page')) {
    throw createError({ statusCode: 400, statusMessage: 'kind and targetId are required' })
  }
  const revoke = body.action === 'revoke'
  const type = body.type
  if (!revoke && (!type || !TYPES.includes(type))) {
    throw createError({ statusCode: 400, statusMessage: 'Choose the badge: personal, business or government' })
  }
  const patch = { is_verified: !revoke, verified_type: revoke ? null : type, verified_at: revoke ? null : now }

  if (kind === 'page') {
    const { data: page, error } = await service.from('pages').update(patch as never).eq('id', targetId).select('created_by_user_id, name').maybeSingle()
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    ownerId = ownerId ?? page.created_by_user_id
  } else {
    const { data: user, error } = await service.from('user').update({ ...patch, updated_at: now } as never).eq('user_id', targetId).select('user_id').maybeSingle()
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    ownerId = ownerId ?? targetId
  }

  if (revoke) {
    // Close the approved request so the owner can apply again.
    let approved = service.from('badge_requests').update({ status: 'revoked', review_note: note, reviewed_by: staff.id, updated_at: now } as never).eq('status', 'approved')
    approved = kind === 'page' ? approved.eq('page_id', targetId) : approved.eq('user_id', targetId).is('page_id', null)
    await approved
  }

  await logStaffAction(staff.id, `verification_${body.action}`, kind, targetId, { type: patch.verified_type, note })
  if (ownerId) {
    const what = kind === 'page' ? 'Your Page' : 'Your account'
    await sendNotification(event, ownerId, 'system', revoke
      ? `${what} verification badge was removed${note ? `: ${note}` : '.'} You can request verification again from your profile.`
      : `${what} is now verified with the ${LABEL[type as BadgeType]} badge.`, staff.id)
  }
  return { success: true, verified: !revoke, type: patch.verified_type }
})
