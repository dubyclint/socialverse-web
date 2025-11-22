// FILE: /middleware/security-middleware.ts - SESSION VALIDATION
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to protected routes via definePageMeta
// Purpose: Validate user session and check security restrictions
// ============================================================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Security Middleware] Validating session for: ${to.path}`)

  try {
    // Get token from localStorage (more reliable than cookies in Nuxt)
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    if (!token) {
      console.warn(`[Security Middleware] No token found, redirecting to login`)
      return navigateTo('/auth/signin')
    }

    // Validate session via API
    const { data, error } = await useFetch('/api/auth/validate-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (error.value || !data.value?.valid) {
      console.warn(`[Security Middleware] Session invalid, clearing token`)
      localStorage.removeItem('auth_token')
      return navigateTo('/auth/signin')
    }

    // Check for security restrictions
    const { data: securityData, error: securityError } = await useFetch('/api/security/check-restrictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (securityData.value?.isRestricted) {
      console.warn(`[Security Middleware] User account restricted`)
      return navigateTo('/security-alert')
    }

    console.log(`[Security Middleware] ✓ Session valid for: ${to.path}`)
  } catch (error) {
    console.error(`[Security Middleware] Error:`, error)
    // Don't block navigation on errors, let auth middleware handle it
  }
})
