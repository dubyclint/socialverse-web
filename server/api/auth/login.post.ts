import { createHash } from 'node:crypto'
import { createError, getRequestIP, readBody, setResponseHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'

const minutesLeft = (until: string) => Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 60000))

const lockedError = (event: Parameters<typeof setResponseHeader>[0], until: string) => {
  setResponseHeader(event, 'Retry-After', minutesLeft(until) * 60)
  return createError({ statusCode: 429, statusMessage: `Too many failed sign-ins. Try again in ${minutesLeft(until)} minute(s) or reset your password.` })
}

/** Password sign-in with per-account lockout (3 fails -> 12 min, then 5 fails -> 30 min) and per-IP rate limiting. */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'auth-login', { limit: 20, windowMs: 15 * 60_000 })
  const body = await readBody<{ email?: string, password?: string }>(event)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  if (!email || !password || email.length > 320 || password.length > 512) {
    throw createError({ statusCode: 400, statusMessage: 'Enter your email and password' })
  }

  const db = getServiceClient()
  const key = createHash('sha256').update(email).digest('hex')
  const { data: lockedUntil } = await db.rpc('login_guard_check' as never, { p_key: key } as never)
  if (lockedUntil) throw lockedError(event, String(lockedUntil))

  const config = useRuntimeConfig()
  const url = (config.public.supabaseUrl || process.env.SUPABASE_URL) as string
  const anon = (config.public.supabaseKey || process.env.SUPABASE_ANON_KEY) as string
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    const status = (error as { status?: number } | null)?.status ?? 400
    if (status >= 500 || status === 429) {
      throw createError({ statusCode: status === 429 ? 429 : 503, statusMessage: 'Sign-in is busy. Please try again shortly.' })
    }
    if ((error as { code?: string } | null)?.code === 'email_not_confirmed') {
      throw createError({ statusCode: 403, statusMessage: 'Confirm your email first. Check your inbox for the link.' })
    }
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const { data: rows } = await db.rpc('login_guard_fail' as never, { p_key: key, p_ip: ip } as never)
    const r = (rows as unknown as { locked_until: string | null, attempts_left: number }[] | null)?.[0]
    if (r?.locked_until) throw lockedError(event, r.locked_until)
    const left = Number(r?.attempts_left ?? 0)
    throw createError({ statusCode: 401, statusMessage: `Wrong email or password.${left > 0 && left <= 2 ? ` ${left} attempt(s) left before a temporary lock.` : ''}` })
  }

  await db.rpc('login_guard_success' as never, { p_key: key } as never)
  return { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
})
