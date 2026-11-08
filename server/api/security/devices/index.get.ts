import { getQuery } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { ONLINE_WINDOW_MS } from '~/server/utils/devices'

/** Every device that signed in to this account, newest activity first. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const current = String(getQuery(event).device_id ?? '')
  const db = getServiceClient()
  const [{ data: rows }, { data: policy }, { data: factors }] = await Promise.all([
    db.from('user_devices' as never).select('device_id, label, ip, location, allowed, first_seen, last_seen, signed_out_at').eq('user_id', user.id).order('last_seen', { ascending: false }).limit(100),
    db.from('user_device_policy' as never).select('mode').eq('user_id', user.id).maybeSingle(),
    db.auth.admin.mfa.listFactors({ userId: user.id })
  ])
  const now = Date.now()
  const devices = ((rows ?? []) as { device_id: string, label: string | null, ip: string | null, location: string | null, allowed: boolean, first_seen: string, last_seen: string, signed_out_at: string | null }[])
    .map(d => ({
      ...d,
      current: d.device_id === current,
      signed_in: !d.signed_out_at,
      online: !d.signed_out_at && now - new Date(d.last_seen).getTime() < ONLINE_WINDOW_MS
    }))
  return {
    devices,
    mode: (policy as { mode?: string } | null)?.mode ?? 'any',
    has_2fa: (factors?.factors ?? []).some(f => f.status === 'verified')
  }
})
