// ============================================================================
// FILE: /middleware/security-middleware.ts - GLOBAL SECURITY GUARD
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Safety Guard for undefined route
  if (!to || !to.path) return

  const authStore = useAuthStore()

  try {
    // 2. Authentication Check
    // If we reach here and the user isn't authenticated, redirect.
    if (!authStore.isAuthenticated) {
      console.warn(`[Security] Blocked unauthenticated access to: ${to.path}`)
      return navigateTo('/signin', { replace: true })
    }

    // 3. Role-Based Access Control (RBAC)
    const userRole = authStore.user?.role || 'user'

    // Protecting Admin Routes
    if (to.path.startsWith('/admin')) {
      if (userRole !== 'admin') {
        console.warn(`[Security] User ${authStore.userId} denied access to: ${to.path}`)
        return navigateTo('/feed', { replace: true }) 
      }
    }

    // Example: Protecting Premium/Pro Features
    if (to.path.startsWith('/pro-features')) {
      const isPremium = authStore.user?.user_metadata?.is_premium === true
      if (!isPremium) {
        return navigateTo('/upgrade', { replace: true })
      }
    }

  } catch (error) {
    console.error('[Security Middleware] Fatal Error:', error)
    // If security fails to evaluate, default to safe action (kick them out)
    return navigateTo('/signin', { replace: true })
  }
})
