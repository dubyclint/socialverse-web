//file: /middleware/guest.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return

  console.log(`[Guest Middleware] Checking route: ${to.path}`)

  try {
    const authStore = useAuthStore()
    
    if (!authStore.isHydrated) {
      console.log('[Guest Middleware] Store not hydrated yet, initializing...')
      authStore.initializeSession()
    }

    // Check if we have a token and it's not expired
    if (authStore.token && authStore.user) {
      // Verify token is still valid by checking if it has an expiration
      // If token exists but user data is incomplete, clear it
      if (!authStore.user.id || !authStore.user.email) {
        console.log('[Guest Middleware] Invalid user data detected, clearing auth')
        authStore.clearAuth()
        return
      }

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

