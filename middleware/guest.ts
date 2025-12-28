//file: /middleware/guest.ts - FIXED VERSION
export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) return

  console.log(`[Guest Middleware] Checking route: ${to.path}`)

  try {
    const authStore = useAuthStore()
    
    console.log('[Guest Middleware] Auth Store State:', {
      isAuthenticated: authStore.isAuthenticated,
      hasToken: !!authStore.token,
      hasUser: !!authStore.user,
      isHydrated: authStore.isHydrated
    })

    if (!authStore.isHydrated) {
      console.log('[Guest Middleware] Store not hydrated yet, initializing...')
      authStore.initializeSession()
    }

    if (authStore.isAuthenticated && authStore.token && authStore.user) {
      console.log(`[Guest Middleware] ✓ Authenticated user redirected from ${to.path} to /feed`)
      return navigateTo('/feed')
    }

    console.log(`[Guest Middleware] ✓ Unauthenticated user allowed to access ${to.path}`)
    return
  } catch (error) {
    console.error('[Guest Middleware] Error:', error)
    return
  }
})
