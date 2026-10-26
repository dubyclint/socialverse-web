import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { nextPasswordChangeAt, recordPasswordEvent, limitMessage } from '~/server/utils/password-policy'

/** Sets a new password using the recovery token from the emailed link. */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'auth:password:update', { limit: 10, windowMs: 60 * 60_000 })
  const body = await readBody<{ accessToken?: string, password?: string }>(event)
  const password = String(body?.password || '')
  if (!body?.accessToken) throw createError({ statusCode: 400, statusMessage: 'This reset link is invalid. Request a new one.' })
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw createError({ statusCode: 400, statusMessage: 'Use at least 8 characters with letters and numbers.' })
  }

  const db = getServiceClient()
  const { data, error } = await db.auth.getUser(body.accessToken)
  if (error || !data.user) throw createError({ statusCode: 401, statusMessage: 'This reset link has expired. Request a new one.' })

  const next = await nextPasswordChangeAt(data.user.id)
  if (next) throw createError({ statusCode: 429, statusMessage: limitMessage(next) })

  const { error: updErr } = await db.auth.admin.updateUserById(data.user.id, { password })
  if (updErr) throw createError({ statusCode: 400, statusMessage: updErr.message })
  await recordPasswordEvent(data.user.id, 'changed')
  return { success: true }
})
