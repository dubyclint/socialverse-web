// ============================================================================
// FILE: /middleware/security-middleware.ts - GLOBAL SECURITY GUARD
// ============================================================================
import { useUserStore } from '~/stores/user'

export default defineNuxtRouteMiddleware(async (to: any) => {
  if (!to?.path) return

  const userStore = useUserStore()
  const tokenCookie = useCookie('auth_token')

  try {
    // 1. Ensure user is loaded
    if (tokenCookie.value && !userStore.user) {
      await userStore.fetchProfile()
    }

    // 2. Authentication Check
    if (!userStore.user) {
      console.warn(`[Security] Blocked unauthenticated access to: ${to.path}`)
      return navigateTo('/signin', { replace: true })
    }

    // 3. Role-Based Access Control (RBAC)
    const userRole = userStore.user.role || 'user'

    // Protecting Admin Routes
    if (to.path.startsWith('/admin') && userRole !== 'admin') {
      console.warn(`[Security] User ${userStore.user.id} denied access to: ${to.path}`)
      return navigateTo('/feed', { replace: true }) 
    }

    // Protecting Premium/Pro Features
    if (to.path.startsWith('/pro-features')) {
      const isPremium = userStore.user.user_metadata?.is_premium === true
      if (!isPremium) {
        return navigateTo('/upgrade', { replace: true })
      }
    }

  } catch (error) {
    console.error('[Security Middleware] Fatal Error:', error)
    userStore.logout()
    return navigateTo('/signin', { replace: true })
  }
})
