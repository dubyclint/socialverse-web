export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return

  console.log(`[Guest Middleware] Checking route: ${to.path}`)

  try {
    const authStore = useAuthStore()
    
    // First, ensure store is hydrated
    if (!authStore.isHydrated) {
      console.log('[Guest Middleware] Store not hydrated, hydrating from storage...')
      authStore.hydrateFromStorage()
    }

    // Only redirect if ALL conditions are true:
    // 1. Store is hydrated
    // 2. Has valid token
    // 3. Has valid user data with id and email
    if (authStore.isHydrated && authStore.token && authStore.user && authStore.user.id && authStore.user.email) {
      console.log(`[Guest Middleware] ✓ Authenticated user redirected from ${to.path} to /feed`)
      return navigateTo('/feed')
    }

    // If we have stale data (token but no valid user), clear it
    if (authStore.token && (!authStore.user || !authStore.user.id || !authStore.user.email)) {
      console.log('[Guest Middleware] Stale auth data detected, clearing...')
      authStore.clearAuth()
    }

    console.log(`[Guest Middleware] ✓ Unauthenticated user allowed to access ${to.path}`)
    return
  } catch (error) {
    console.error('[Guest Middleware] Error:', error)
    return
  }
})
