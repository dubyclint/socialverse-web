// ============================================================================
// FILE: /middleware/status-middleware.ts - STATUS VALIDATION
// ============================================================================
import { useUserStore } from '~/stores/user'
import { useSupabaseUser } from '#imports'

export default defineNuxtRouteMiddleware(async (to: any) => {
  if (!to?.path || import.meta.server) return

  const statusRoutes = ['/stream', '/status/create', '/posts/create']
  const isStatusRoute = statusRoutes.some(route => to.path.startsWith(route))

  if (!isStatusRoute) return

  try {
    const userStore = useUserStore()
    const supabaseUser = useSupabaseUser()
    
    if (supabaseUser.value && !userStore.user) {
      await userStore.fetchProfile()
    }

    if (!supabaseUser.value && !userStore.user) {
      console.warn(`[Status Middleware] No user found, redirecting...`)
      return navigateTo('/signin')
    }

    to.meta.userRole = userStore.user?.role || 'user'
    to.meta.isPremium = userStore.user?.user_metadata?.is_premium || false

    console.log(`[Status Middleware] ✓ UI State prepared for: ${to.path}`)
  } catch (error) {
    console.error(`[Status Middleware] Error:`, error)
    return navigateTo('/signin')
  }
})
