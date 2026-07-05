// ============================================================================
// FILE: /middleware/auth.ts - STABLE PROTECTED-ROUTE GUARD
// ============================================================================
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Safety Guard for undefined route
  if (!to?.path) return

  const userStore = useUserStore()
  const tokenCookie = useCookie('auth_token')
  const normalizedPath = to.path.replace(/\/$/, '') || '/'

  // 2. Define routes
  const publicRoutes = [
    '/', '/signin', '/signup', '/auth/forgot-password', 
    '/auth/reset-password', '/auth/verify-email', 
    '/terms-and-policy', '/privacy-policy'
  ]
  const protectedPrefixes = [
    '/feed', '/profile', '/settings', '/notifications', 
    '/messages', '/inbox', '/chat', '/explore', '/match', '/wallet', '/admin'
  ]

  const startsWithSegment = (path: string, prefix: string) => 
    path === prefix || path.startsWith(`${prefix}/`)
  
  const isPublicRoute = publicRoutes.some((route) => startsWithSegment(normalizedPath, route))
  const isProtectedRoute = protectedPrefixes.some((route) => startsWithSegment(normalizedPath, route))

  // 3. Only guard protected routes
  if (!isProtectedRoute || isPublicRoute) return

  // 4. Secure Auth Check
  if (!tokenCookie.value) {
    return navigateTo(`/signin?redirect=${encodeURIComponent(to.fullPath)}`, { replace: true })
  }

  // 5. Token & User Validation
  try {
    // If the store is empty (e.g., page refresh), fetch the user profile
    if (!userStore.user) {
      await userStore.fetchProfile()
    }
    
    // Ensure the user session is active
    if (!userStore.user) {
      throw new Error('User session invalid')
    }
  } catch (error) {
    console.error('[Auth Middleware] Validation failed:', error)
    userStore.logout() // Clears state and cookies
    return navigateTo('/signin', { replace: true })
  }
})
