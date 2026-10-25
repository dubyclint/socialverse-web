// ============================================================================
// FILE: /server/gateway/auth/auth-header.ts
// ============================================================================
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseClient, serverSupabaseSession, serverSupabaseUser } from '#supabase/server'
import { isMfaPending } from '~/server/utils/mfa'
import { useRuntimeConfig } from '#imports'

const publicApiPrefixes = [
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/public/'
]

/**
 * Resolves the caller for every `/api/**` request from the SSR cookie session
 * or, for native and scripted clients, an `Authorization: Bearer` token. A
 * bearer caller also gets a token-bound Supabase client so RLS sees them.
 */
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return
  if (publicApiPrefixes.some(p => path.startsWith(p))) return

  let mfaPending = false
  try {
    let user = await serverSupabaseUser(event).catch(() => null)
    let accessToken: string | null = null

    if (!user) {
      const authHeader = getHeader(event, 'authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
      if (!token) return

      const { url, key } = useRuntimeConfig(event).public.supabase
      const tokenClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
      })
      const { data, error } = await tokenClient.auth.getUser(token)
      if (error || !data?.user) return

      user = data.user
      accessToken = token
      event.context._supabaseClient = tokenClient
    } else {
      await serverSupabaseClient(event)
      accessToken = (await serverSupabaseSession(event).catch(() => null))?.access_token ?? null
    }
    mfaPending = isMfaPending(user.factors, accessToken)

    event.context.user = {
      id: user.id,
      user_id: user.id,
      sub: user.id,
      email: user.email || null,
      role: user.role || 'user',
      raw: user
    }
  } catch (err: unknown) {
    console.warn('[Auth Middleware] Unable to populate context user:', err instanceof Error ? err.message : err)
  }
  // Password-only session on a 2FA account: only the 2FA step itself is reachable.
  if (mfaPending && !path.startsWith('/api/auth/mfa/')) {
    throw createError({ statusCode: 401, statusMessage: 'Two-factor verification required' })
  }
})
