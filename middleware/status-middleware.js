// FILE: /middleware/status-middleware.ts - STATUS VALIDATION
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to status creation routes
// Purpose: Validate status content before creation
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  // Only apply to status-related routes
  const statusRoutes = ['/stream', '/status/create', '/posts/create']
  const isStatusRoute = statusRoutes.some(route => to.path.startsWith(route))

  if (!isStatusRoute) return

  console.log(`[Status Middleware] Validating status route: ${to.path}`)

  try {
    const authStore = useAuthStore()
    const user = authStore.user

    if (!user) {
      console.warn(`[Status Middleware] No user found`)
      return navigateTo('/auth/signin')
    }

    // Check if user has active status limit
    // This would typically be checked when creating, not on route entry
    // But we can validate permissions here
    const userRole = user.role || 'user'
    const isPremium = user.is_premium || false

    // Store in route meta for use in components
    to.meta.userRole = userRole
    to.meta.isPremium = isPremium

    console.log(`[Status Middleware] ✓ User validated for status creation`)
  } catch (error) {
    console.error(`[Status Middleware] Error:`, error)
    // Don't block navigation on errors
  }
})
