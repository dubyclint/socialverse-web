// FILE: /middleware/premium-middleware.ts - PREMIUM FEATURE ACCESS
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to premium routes via definePageMeta
// Purpose: Check if user has access to premium features
// ============================================================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Premium Middleware] Checking premium access for: ${to.path}`)

  try {
    const authStore = useAuthStore()
    const user = authStore.user

    if (!user) {
      console.warn(`[Premium Middleware] No user found, redirecting to login`)
      return navigateTo('/auth/signin')
    }

    // Get token
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    if (!token) {
      return navigateTo('/auth/signin')
    }

    // Check premium status via API
    const requiredFeature = to.meta?.requiredFeature || 'premium'
    
    const { data, error } = await useFetch('/api/premium/check-access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        userId: user.id,
        featureKey: requiredFeature
      }
    })

    if (error.value || !data.value?.hasAccess) {
      console.warn(`[Premium Middleware] User lacks premium access for: ${requiredFeature}`)
      return navigateTo('/premium')
    }

    // Check for premium restrictions
    const { data: restrictionData } = await useFetch('/api/premium/check-restrictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: { userId: user.id }
    })

    if (restrictionData.value?.isRestricted) {
      console.warn(`[Premium Middleware] Premium account restricted`)
      return navigateTo('/account-restricted')
    }

    console.log(`[Premium Middleware] ✓ Premium access granted for: ${to.path}`)
  } catch (error) {
    console.error(`[Premium Middleware] Error:`, error)
    // Don't block navigation on errors
  }
})
