// ============================================================================
// FILE: /middleware/status-middleware.ts - STATUS VALIDATION
// ============================================================================

export default defineNuxtRouteMiddleware((to) => {
  // ✅ Keeping this as client-only is correct.
  // This middleware prepares the UI state for interactions.
  if (import.meta.server) return

  const statusRoutes = ['/stream', '/status/create', '/posts/create']
  const isStatusRoute = statusRoutes.some(route => to.path.startsWith(route))

  if (!isStatusRoute) return

  try {
    const authStore = useAuthStore()
    
    // Ensure the store is hydrated before we try to read the user
    // (Though by the time this runs, the global auth middleware has already finished)
    if (!authStore.user) {
      console.warn(`[Status Middleware] No user found, redirecting...`)
      return navigateTo('/signin')
    }

    // Access role and premium status safely
    const userRole = authStore.user.role || 'user'
    const isPremium = authStore.user.user_metadata?.is_premium || false

    // Store in route meta for reactive use in components
    to.meta.userRole = userRole
    to.meta.isPremium = isPremium

    console.log(`[Status Middleware] ✓ UI State prepared for: ${to.path}`)
  } catch (error) {
    console.error(`[Status Middleware] Error:`, error)
  }
})
