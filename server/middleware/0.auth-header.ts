import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return

  // Skip middleware auth context population for public/auth bootstrap routes
  const publicApiPrefixes = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/health',
    '/api/public/'
  ]
  if (publicApiPrefixes.some((p) => path.startsWith(p))) return

  try {
    // 1) Cookie/session user
    let user: any = await serverSupabaseUser(event)

    // 2) Bearer token fallback
    if (!user) {
      const authHeader = getHeader(event, 'authorization') || ''
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim()
        if (token) {
          const supabase = await serverSupabaseClient(event)
          const { data, error } = await supabase.auth.getUser(token)
          if (!error && data?.user) {
            user = data.user
          }
        }
      }
    }

    if (!user?.id) return

    const resolvedId = String(user.id || user.user_id || '').split(':')[0].trim()
    if (!resolvedId) return

    event.context.user = {
      id: resolvedId,
      user_id: resolvedId,
      sub: resolvedId,
      email: user.email || null,
      role: user.role || 'user',
      raw: user
    }
  } catch (err: any) {
    // Never hard-fail globally from middleware
    console.warn('[Auth Middleware] Unable to populate context user:', err?.message || err)
    return
  }
})
