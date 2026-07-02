// ============================================================================
// FILE: /middleware/auth.ts - STABLE PROTECTED-ROUTE GUARD
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // 🚨 CRITICAL FIX: Removed `if (process.server) return`
  // The server MUST enforce authentication to prevent leaking protected HTML payloads.

  const authStore = useAuthStore()
  const normalizedPath = to.path.replace(/\/$/, '') || '/'

  // Public routes
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/terms-and-policy',
    '/privacy-policy'
  ]

  // Protected route prefixes
  const protectedPrefixes = [
    '/feed',
    '/profile',
    '/settings',
    '/notifications',
    '/messages',
    '/inbox',
    '/chat',
    '/explore',
    '/match',
    '/wallet',
    '/admin'
  ]

  const startsWithSegment = (path: string, prefix: string) =>
    path === prefix || path.startsWith(`${prefix}/`)

  const isPublicRoute = publicRoutes.some((route) => startsWithSegment(normalizedPath, route))
  const isProtectedRoute = protectedPrefixes.some((route) => startsWithSegment(normalizedPath, route))

  // Only guard protected routes
  if (!isProtectedRoute || isPublicRoute) return

  // ✅ SAFE HYDRATION: Only attempt to hydrate from local/session storage on the client
  // NOTE: For true SSR protection, your auth token SHOULD be in a cookie (e.g., useCookie('token'))
  // so the server knows the user is authenticated before sending the page.
  if (!authStore.isHydrated && import.meta.client) {
    if (typeof authStore.hydrateFromStorage === 'function') {
      await authStore.hydrateFromStorage()
    } else if (typeof authStore.initializeSession === 'function') {
      await authStore.initializeSession()
    }
  }

  // If still no token/user, redirect
  // If running on the server, Nuxt will intercept this and issue an HTTP 302 redirect securely.
  if (!authStore.token || !authStore.userId) {
    if (import.meta.client) authStore.clearAuth()
    return navigateTo('/signin', { replace: true })
  }

  // Soft validation throttle: do not hammer /api/auth/me on every navigation
  // validateToken() in your auth store already has a 60s throttle.
  try {
    // Note: If validateToken makes a fetch call, ensure it passes cookie headers 
    // when running on the server, or this will fail during SSR.
    const isValid = await authStore.validateToken()
    if (!isValid) {
      if (import.meta.client) authStore.clearAuth()
      return navigateTo('/signin', { replace: true })
    }
  } catch (error) {
    console.error('[Auth Middleware] Token validation failed:', error)
    if (import.meta.client) authStore.clearAuth()
    return navigateTo('/signin', { replace: true })
  }

  return
})
