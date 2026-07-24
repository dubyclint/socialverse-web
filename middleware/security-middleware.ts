// ============================================================================
// FILE: /middleware/security-middleware.ts - GLOBAL SECURITY GUARD
// ============================================================================
import { useUserStore } from '~/stores/user'
import { useSupabaseUser } from '#imports'

export default defineNuxtRouteMiddleware(async (to: any) => {
  if (!to?.path) return

  const userStore = useUserStore()
  const supabaseUser = useSupabaseUser()

  try {
    if (supabaseUser.value && !userStore.user) {
      await userStore.fetchProfile()
    }

    if (!supabaseUser.value && !userStore.user) {
      console.warn(`[Security] Blocked unauthenticated access to: ${to.path}`)
      return navigateTo('/signin', { replace: true })
    }

    const userRole = userStore.user?.role || 'user'

    if (to.path.startsWith('/admin') && userRole !== 'admin') {
      console.warn(`[Security] User denied access to: ${to.path}`)
      return navigateTo('/feed', { replace: true }) 
    }

    if (to.path.startsWith('/pro-features')) {
      const isPremium = userStore.user?.user_metadata?.is_premium === true
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
