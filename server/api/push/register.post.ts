import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Stores this device's FCM token so calls and alerts reach it when the app is closed. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ token?: string | null } | null>(event).catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : null
  if (token !== null && (token.length < 20 || token.length > 4096)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid push token' })
  }
  const admin = getServiceClient()
  // A device belongs to one account: drop the token from anyone who used it before.
  if (token) await admin.from('user').update({ push_token: null }).eq('push_token', token).neq('user_id', user.id)
  const { error } = await admin.from('user').update({ push_token: token }).eq('user_id', user.id)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not save push token' })
  return { success: true }
})
