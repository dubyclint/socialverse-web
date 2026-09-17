// ============================================================================
// FILE: /middleware/status-middleware.ts - STATUS VALIDATION
// ============================================================================
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to: any) => {
  // 1. Safety Guard and Server Check
  if (!to?.path || import.meta.server) return

  const statusRoutes = ['/stream', '/status/create', '/posts/create']
  const isStatusRoute = statusRoutes.some(route => to.path.startsWith(route))

  if (!isStatusRoute) return

  try {
    const userStore = useUserStore()
    
    // Ensure user state is populated
    if (!userStore.user) {
      await userStore.fetchProfile()
    }

    // 2. Auth validation
    if (!userStore.user) {
      console.warn(`[Status Middleware] No user found, redirecting...`)
      return navigateTo('/signin')
    }

    // 3. Prepare meta data for reactive UI components
    to.meta.userRole = userStore.user.role || 'user'
    to.meta.isPremium = userStore.user.user_metadata?.is_premium || false

    console.log(`[Status Middleware] ✓ UI State prepared for: ${to.path}`)
  } catch (error) {
    console.error(`[Status Middleware] Error:`, error)
    return navigateTo('/signin')
  }
})
