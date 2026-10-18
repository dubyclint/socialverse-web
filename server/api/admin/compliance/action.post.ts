import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { sendNotification } from '~/server/utils/send-notification'
import { RESTRICTION_KEYS } from '~/utils/staff-permissions'

interface Body {
  userId?: string
  action?: 'ban' | 'unban' | 'restrict' | 'unrestrict'
  hours?: number | null
  feature?: string
  reason?: string
}

const FEATURES = RESTRICTION_KEYS.map(r => r.key) as string[]

/** Ban (permanent or timed), unban, and per-feature restrictions. Admins cannot be targeted. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'compliance')
  const body = await readBody<Body>(event)
  if (!body?.userId) throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  if (body.userId === staff.id) throw createError({ statusCode: 400, statusMessage: 'You cannot restrict yourself' })
  const reason = body.reason?.trim().slice(0, 500) || null
  const hours = body.hours ? Number(body.hours) : null
  if (hours !== null && (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 365 * 5)) {
    throw createError({ statusCode: 400, statusMessage: 'Duration must be between 1 hour and 5 years' })
  }
  const until = hours ? new Date(Date.now() + hours * 3600_000).toISOString() : null

  const service = getServiceClient()
  const { data: target } = await service.from('user').select('role, restrictions').eq('user_id', body.userId).maybeSingle()
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  if (target.role === 'admin' || (target.role === 'manager' && staff.role !== 'admin')) {
    throw createError({ statusCode: 403, statusMessage: 'You cannot restrict this account' })
  }

  let patch: Record<string, unknown>
  let message: string
  switch (body.action) {
    case 'ban':
      if (!reason) throw createError({ statusCode: 400, statusMessage: 'A reason is required' })
      patch = { is_banned: true, banned_at: new Date().toISOString(), banned_until: until, ban_reason: reason }
      message = `Your account has been suspended${until ? ` until ${new Date(until).toUTCString()}` : ''}: ${reason}`
      break
    case 'unban':
      patch = { is_banned: false, banned_until: null, ban_reason: null }
      message = 'Your account suspension has been lifted.'
      break
    case 'restrict':
    case 'unrestrict': {
      if (!body.feature || !FEATURES.includes(body.feature)) throw createError({ statusCode: 400, statusMessage: 'Unknown feature' })
      const restrictions = { ...((target.restrictions as Record<string, unknown> | null) ?? {}) }
      const label = RESTRICTION_KEYS.find(r => r.key === body.feature)?.label ?? body.feature
      if (body.action === 'restrict') {
        if (!reason) throw createError({ statusCode: 400, statusMessage: 'A reason is required' })
        restrictions[body.feature] = { until, reason, by: staff.id, at: new Date().toISOString() }
        message = `${label} has been restricted on your account${until ? ` until ${new Date(until).toUTCString()}` : ''}: ${reason}`
      } else {
        delete restrictions[body.feature]
        message = `${label} is available on your account again.`
      }
      patch = { restrictions }
      break
    }
    default:
      throw createError({ statusCode: 400, statusMessage: 'action must be ban, unban, restrict or unrestrict' })
  }

  const { error } = await service.from('user').update({ ...patch, updated_at: new Date().toISOString() } as never).eq('user_id', body.userId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(staff.id, `compliance_${body.action}`, 'user', body.userId, { feature: body.feature ?? null, until, reason })
  await sendNotification(event, body.userId, 'system', message, staff.id)
  return { success: true }
})
