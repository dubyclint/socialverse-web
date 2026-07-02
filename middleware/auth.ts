// ============================================================================
// FILE: /middleware/auth.ts - STABLE PROTECTED-ROUTE GUARD
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Safety Guard for undefined route
  if (!to || !to.path) return

  const authStore = useAuthStore()
  const tokenCookie = useCookie('auth_token')
  const normalizedPath = to.path.replace(/\/$/, '') || '/'

  // 2. Define routes
  const publicRoutes = ['/', '/signin', '/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/terms-and-policy', '/privacy-policy']
  const protectedPrefixes = ['/feed', '/profile', '/settings', '/notifications', '/messages', '/inbox', '/chat', '/explore', '/match', '/wallet', '/admin']

  const startsWithSegment = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)
  
  const isPublicRoute = publicRoutes.some((route) => startsWithSegment(normalizedPath, route))
  const isProtectedRoute = protectedPrefixes.some((route) => startsWithSegment(normalizedPath, route))

  // 3. Only guard protected routes
  if (!isProtectedRoute || isPublicRoute) return

  // 4. Secure Auth Check (SSR & Client)
  // If the cookie is missing, the user is not logged in.
  if (!tokenCookie.value) {
    return navigateTo('/signin', { replace: true })
  }

  // 5. Token Validation
  try {
    // authStore.validateToken() is SSR-safe because it uses the cookie 
    // automatically via $fetch headers if configured correctly in your fetch interceptor.
    const isValid = await authStore.validateToken()
    if (!isValid) {
      return navigateTo('/signin', { replace: true })
    }
  } catch (error) {
    console.error('[Auth Middleware] Token validation failed:', error)
    authStore.clearAuth()
    return navigateTo('/signin', { replace: true })
  }
})
