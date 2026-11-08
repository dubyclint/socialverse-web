import { createError, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { tokenClaims } from '~/server/utils/devices'

/**
 * Device restriction: any device, only approved devices, or only this device.
 * Changing it needs a session that just passed 2FA (aal2).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ mode?: string, allowed?: string[], device_id?: string }>(event)
  const mode = body?.mode
  if (!mode || !['any', 'listed', 'single'].includes(mode)) throw createError({ statusCode: 400, statusMessage: 'Choose a device rule' })

  const db = getServiceClient()
  const { data: factors } = await db.auth.admin.mfa.listFactors({ userId: user.id })
  if (!(factors?.factors ?? []).some(f => f.status === 'verified')) {
    throw createError({ statusCode: 403, statusMessage: 'Turn on two-factor authentication first' })
  }
  if (tokenClaims(event).aal !== 'aal2') {
    throw createError({ statusCode: 403, statusMessage: 'Confirm with your 2FA code' })
  }

  const current = String(body?.device_id ?? '')
  if (mode !== 'any' && !current) throw createError({ statusCode: 400, statusMessage: 'This device is unknown; reload and try again' })
  const allowed = mode === 'single' ? [current] : mode === 'listed' ? Array.from(new Set([current, ...(body?.allowed ?? [])])) : []

  await db.from('user_devices' as never).update({ allowed: false } as never).eq('user_id', user.id)
  if (allowed.length) await db.from('user_devices' as never).update({ allowed: true } as never).eq('user_id', user.id).in('device_id', allowed)
  await db.from('user_device_policy' as never).upsert({ user_id: user.id, mode, updated_at: new Date().toISOString() } as never)

  if (mode !== 'any') {
    // Sign out every device that is not approved.
    const { data: others } = await db.from('user_devices' as never).select('device_id, session_id').eq('user_id', user.id).eq('allowed', false).is('signed_out_at', null)
    const rows = (others ?? []) as { device_id: string, session_id: string | null }[]
    const sessions = rows.map(r => r.session_id).filter((s): s is string => !!s)
    if (sessions.length) await db.rpc('revoke_auth_sessions' as never, { p_user: user.id, p_sessions: sessions } as never)
    if (rows.length) await db.from('user_devices' as never).update({ signed_out_at: new Date().toISOString() } as never).eq('user_id', user.id).in('device_id', rows.map(r => r.device_id))
  }
  return { mode, allowed }
})
