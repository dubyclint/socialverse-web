// ============================================================================
// CORRECTED FILE: /middleware/guest.ts
// ============================================================================
// FIX: Better handling of stale auth data
// ============================================================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return

  console.log(`[Guest Middleware] Checking route: ${to.path}`)

  try {
    const authStore = useAuthStore()
    
    // First, ensure store is hydrated
    if (!authStore.isHydrated) {
      console.log('[Guest Middleware] Store not hydrated, hydrating from storage...')
      await authStore.hydrateFromStorage()
    }

    console.log('[Guest Middleware] Auth state:', {
      isHydrated: authStore.isHydrated,
      hasToken: !!authStore.token,
      hasUser: !!authStore.user,
      userId: authStore.user?.id
    })

    // ✅ FIX: Check if user is TRULY authenticated
    // A user is authenticated only if:
    // 1. Has a valid token
    // 2. Has valid user data with id and email
    // 3. Token is not expired (we'll check this via API call)
    
    if (authStore.isHydrated && authStore.token && authStore.user && authStore.user.id && authStore.user.email) {
      console.log('[Guest Middleware] User appears to be authenticated, checking token validity...')
      
      // Try to validate the token
      try {
        const response = await $fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authStore.token}`
          }
        })
        
        if (response?.user) {
          console.log(`[Guest Middleware] ✓ Token is valid, authenticated user redirected from ${to.path} to /feed`)
          return navigateTo('/feed')
        }
      } catch (err: any) {
        console.log('[Guest Middleware] Token validation failed:', err.message)
        console.log('[Guest Middleware] Clearing stale auth data...')
        authStore.clearAuth()
      }
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
