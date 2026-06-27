// ============================================================================
// FILE: /middleware/auth.ts - STABLE PROTECTED-ROUTE GUARD
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

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

  // Hydrate once
  if (!authStore.isHydrated) {
    if (typeof authStore.hydrateFromStorage === 'function') {
      await authStore.hydrateFromStorage()
    } else if (typeof authStore.initializeSession === 'function') {
      await authStore.initializeSession()
    }
  }

  // If still no token/user, redirect
  if (!authStore.token || !authStore.userId) {
    authStore.clearAuth()
    return navigateTo('/signin', { replace: true })
  }

  // Soft validation throttle: do not hammer /api/auth/me on every navigation
  // validateToken() in your auth store already has a 60s throttle.
  try {
    const isValid = await authStore.validateToken()
    if (!isValid) {
      authStore.clearAuth()
      return navigateTo('/signin', { replace: true })
    }
  } catch {
    authStore.clearAuth()
    return navigateTo('/signin', { replace: true })
  }

  return
})
