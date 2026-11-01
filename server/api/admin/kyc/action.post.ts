import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { sendNotification } from '~/server/utils/send-notification'

interface Body { action?: 'approve' | 'reject' | 'revoke' | 'assign', requestId?: string, username?: string, legalName?: string, note?: string }

/**
 * approve/reject act on a request (approve debits the KYC fee; fails on low balance unless pay-later).
 * assign (fee bypass) and revoke are admin-only and act on a username directly.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)
  const action = body?.action
  const staff = await requireStaff(event, action === 'assign' || action === 'revoke' ? 'admin' : 'verification')
  const db = getServiceClient()
  const note = String(body?.note ?? '').trim().slice(0, 500) || null
  const now = new Date().toISOString()

  if (action === 'approve' || action === 'reject') {
    const { data: req } = await db.from('kyc_requests' as never).select('id, user_id, status').eq('id', String(body?.requestId)).maybeSingle()
    const r = req as { id: string, user_id: string, status: string } | null
    if (!r) throw createError({ statusCode: 404, statusMessage: 'Request not found' })
    if (action === 'approve') {
      const { data, error } = await db.rpc('kyc_approve' as never, { p_request: r.id, p_reviewer: staff.id, p_waive: false } as never)
      if (error) throw createError({ statusCode: 409, statusMessage: error.message })
      await logStaffAction(staff.id, 'kyc_approve', 'user', r.user_id, { request: r.id, ...(data as object) })
      await sendNotification(event, r.user_id, 'system', 'Your identity (KYC) is verified.', staff.id)
      return { success: true, charge: data }
    }
    if (!note) throw createError({ statusCode: 400, statusMessage: 'Write a reason for rejecting' })
    await db.from('kyc_requests' as never).update({ status: 'rejected', review_note: note, reviewed_by: staff.id, updated_at: now } as never).eq('id', r.id)
    await db.from('user_kyc' as never).upsert({ user_id: r.user_id, status: 'rejected', updated_at: now } as never, { onConflict: 'user_id' })
    await logStaffAction(staff.id, 'kyc_reject', 'user', r.user_id, { request: r.id, note })
    await sendNotification(event, r.user_id, 'system', `Your KYC was not approved: ${note}. You can apply again.`, staff.id)
    return { success: true }
  }

  if (action === 'assign' || action === 'revoke') {
    const username = String(body?.username ?? '').trim().replace(/^@/, '')
    const { data: u } = await db.from('user').select('user_id, full_name').ilike('username', username).maybeSingle()
    if (!u) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    if (action === 'assign') {
      const legal = String(body?.legalName ?? u.full_name ?? '').trim().slice(0, 120)
      if (legal.split(/\s+/).length < 2) throw createError({ statusCode: 400, statusMessage: 'Enter the legal full name' })
      await db.from('user_kyc' as never).upsert({ user_id: u.user_id, status: 'verified', legal_name: legal, method: 'assigned', verified_at: now, updated_at: now } as never, { onConflict: 'user_id' })
      await sendNotification(event, u.user_id, 'system', 'Your identity (KYC) was verified by Viorp.', staff.id)
    } else {
      await db.from('user_kyc' as never).upsert({ user_id: u.user_id, status: 'revoked', updated_at: now } as never, { onConflict: 'user_id' })
      await sendNotification(event, u.user_id, 'system', `Your KYC was revoked${note ? `: ${note}` : ''}. You can apply again from your profile.`, staff.id)
    }
    await logStaffAction(staff.id, `kyc_${action}`, 'user', u.user_id, { note })
    return { success: true }
  }
  throw createError({ statusCode: 400, statusMessage: 'action must be approve, reject, assign or revoke' })
})
