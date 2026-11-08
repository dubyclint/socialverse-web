import { createError, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { tokenClaims } from '~/server/utils/devices'

/** Signs out one device, or every device except this one. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ device_id?: string, all_others?: boolean }>(event)
  const db = getServiceClient()
  const { session_id: currentSession } = tokenClaims(event)

  let query = db.from('user_devices' as never).select('device_id, session_id').eq('user_id', user.id).is('signed_out_at', null)
  if (!body?.all_others) {
    if (!body?.device_id) throw createError({ statusCode: 400, statusMessage: 'Choose a device' })
    query = query.eq('device_id', body.device_id)
  }
  const { data } = await query
  const targets = ((data ?? []) as { device_id: string, session_id: string | null }[])
    .filter(d => !body?.all_others || d.session_id !== currentSession)
  const sessions = targets.map(d => d.session_id).filter((s): s is string => !!s)

  if (body?.all_others) {
    // Also ends sessions on devices that never sent a heartbeat.
    await db.rpc('revoke_other_auth_sessions' as never, { p_user: user.id, p_keep: currentSession } as never)
  } else if (sessions.length) await db.rpc('revoke_auth_sessions' as never, { p_user: user.id, p_sessions: sessions } as never)
  if (targets.length) {
    await db.from('user_devices' as never).update({ signed_out_at: new Date().toISOString() } as never)
      .eq('user_id', user.id).in('device_id', targets.map(d => d.device_id))
  }
  return { signed_out: targets.length }
})
