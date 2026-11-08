import { createError, getRequestHeader, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { approxLocation, deviceLabel, requestIp, tokenClaims } from '~/server/utils/devices'

/** Records this device as signed in and enforces the account's device restriction. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ device_id?: string }>(event)
  const deviceId = String(body?.device_id ?? '').slice(0, 80)
  if (!/^[\w-]{8,80}$/.test(deviceId)) throw createError({ statusCode: 400, statusMessage: 'Invalid device' })

  const db = getServiceClient()
  const { session_id: sessionId } = tokenClaims(event)
  const ua = (getRequestHeader(event, 'user-agent') ?? '').slice(0, 400)
  const ip = requestIp(event)

  const [{ data: existing }, { data: policy }] = await Promise.all([
    db.from('user_devices' as never).select('id, ip, location, allowed').eq('user_id', user.id).eq('device_id', deviceId).maybeSingle(),
    db.from('user_device_policy' as never).select('mode').eq('user_id', user.id).maybeSingle()
  ])
  const row = existing as { id: string, ip: string | null, location: string | null, allowed: boolean } | null
  const location = row && row.ip === ip ? row.location : await approxLocation(event, ip)
  const now = new Date().toISOString()

  await db.from('user_devices' as never).upsert({
    user_id: user.id,
    device_id: deviceId,
    label: deviceLabel(ua),
    user_agent: ua,
    ip,
    location,
    session_id: sessionId,
    last_seen: now,
    signed_out_at: null
  } as never, { onConflict: 'user_id,device_id' })

  const mode = (policy as { mode?: string } | null)?.mode ?? 'any'
  if (mode !== 'any' && !row?.allowed) {
    if (sessionId) await db.rpc('revoke_auth_sessions' as never, { p_user: user.id, p_sessions: [sessionId] } as never)
    await db.from('user_devices' as never).update({ signed_out_at: now } as never).eq('user_id', user.id).eq('device_id', deviceId)
    return { blocked: true, reason: 'This account only allows its approved devices.' }
  }
  return { ok: true }
})
