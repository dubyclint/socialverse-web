import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { nextPasswordChangeAt, recordPasswordEvent, limitMessage } from '~/server/utils/password-policy'
import { serverSupabaseUser } from '#supabase/server'

const masked = { success: true, message: 'If an account exists with this email, a password reset link has been sent.' }

/** Emails a password reset link (Supabase Auth SMTP). One password change per user per 30 days. */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  await enforceRateLimit(event, 'auth:reset:ip', { limit: 5, windowMs: 60 * 60_000 })
  await enforceRateLimit(event, 'auth:reset:email', { limit: 3, windowMs: 24 * 60 * 60_000 }, email)

  const db = getServiceClient()
  const { data: account } = await db.from('user').select('user_id').eq('email', email).maybeSingle()
  if (!account) return masked

  const signedIn = await serverSupabaseUser(event).catch(() => null)
  const next = await nextPasswordChangeAt(account.user_id)
  if (next) {
    if (signedIn?.id === account.user_id) throw createError({ statusCode: 429, statusMessage: limitMessage(next) })
    return masked
  }

  const origin = process.env.NUXT_PUBLIC_SITE_URL || process.env.NUXT_PUBLIC_APP_URL || getRequestURL(event).origin
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${origin.replace(/\/$/, '')}/auth/reset-password` })
  if (error) {
    console.error('[reset-password] send failed:', error.message)
    throw createError({ statusCode: 502, statusMessage: 'Could not send the email right now. Try again later.' })
  }
  await recordPasswordEvent(account.user_id, 'requested')
  return signedIn?.id === account.user_id ? { success: true, message: `Reset link sent to ${email}` } : masked
})
