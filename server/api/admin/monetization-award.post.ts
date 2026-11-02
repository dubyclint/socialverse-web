import { readBody } from 'h3'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { revenueDb } from '~/server/utils/creator-revenue'
import { clearMonetizedCache } from '~/server/utils/monetization'

/** Admin: award or revoke monetization for any user by username. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'admin')
  const body = await readBody<{ username?: string, action?: 'award' | 'revoke' }>(event)
  const username = String(body?.username ?? '').trim().replace(/^@/, '')
  if (!username || !['award', 'revoke'].includes(String(body?.action))) throw createError({ statusCode: 400, statusMessage: 'username and action (award|revoke) required' })
  const db = revenueDb()
  const { data: target } = await db.from('user').select('user_id, username').ilike('username', username).maybeSingle()
  if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  if (body!.action === 'award') {
    const { error } = await db.from('user_overrides').upsert({ user_id: target.user_id, override_type: 'monetization', key: 'award', value: { awarded_by: staff.id }, created_by: staff.id }, { onConflict: 'user_id,override_type,key' })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  } else {
    await db.from('user_overrides').delete().eq('user_id', target.user_id).eq('override_type', 'monetization')
  }
  clearMonetizedCache(target.user_id)
  await logStaffAction(staff.id, `monetization_${body!.action}`, 'user', target.user_id, { username: target.username })
  return { ok: true, username: target.username, action: body!.action }
})
