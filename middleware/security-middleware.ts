// ============================================================================
// FILE: /middleware/security-middleware.ts
// ============================================================================

export default defineNuxtRouteMiddleware(async (to) => {
  // 🚨 CRITICAL FIX: Removed `if (process.server) return`
  // Security checks MUST run on the server to prevent leaking unauthorized HTML.

  const authStore = useAuthStore()

  try {
    // 1. Failsafe Authentication Check
    // If a route has this middleware but forgot to include the auth middleware,
    // we catch them here. Because our store uses cookies, isAuthenticated works on the server.
    if (!authStore.isAuthenticated) {
      console.warn(`[Security] Blocked unauthenticated access to: ${to.path}`)
      return navigateTo('/signin', { replace: true })
    }

    // 2. Role-Based Access Control (RBAC)
    const userRole = authStore.user?.role || 'user'

    // Example: Protecting Admin Routes
    if (to.path.startsWith('/admin')) {
      if (userRole !== 'admin') {
        console.warn(`[Security] User ${authStore.userId} denied access to admin route: ${to.path}`)
        
        // Redirect unauthorized users to the feed, or throw a 403 Forbidden error
        // throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
        return navigateTo('/feed', { replace: true }) 
      }
    }

    // Example: Protecting Premium/Pro Features
    /*
    if (to.path.startsWith('/pro-features')) {
      if (!authStore.user?.user_metadata?.is_premium) {
        return navigateTo('/upgrade', { replace: true })
      }
    }
    */

  } catch (error) {
    console.error('[Security Middleware] Fatal Error:', error)
    // If security fails to evaluate, default to safe action (kick them out)
    return navigateTo('/signin', { replace: true })
  }
})
