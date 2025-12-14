// FILE: /middleware/security-middleware.ts (FIXED)
// ============================================================================
// SESSION VALIDATION MIDDLEWARE - FIXED (Removed 404 API call)
// ============================================================================

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Security Middleware] Validating session for: ${to.path}`)

  try {
    // Get token from localStorage
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    if (!token) {
      console.warn(`[Security Middleware] No token found, redirecting to login`)
      return navigateTo('/auth/signin')
    }

    // Get user from localStorage
    const userStr = typeof window !== 'undefined'
      ? localStorage.getItem('auth_user')
      : null

    if (!userStr) {
      console.warn(`[Security Middleware] No user data found, redirecting to login`)
      return navigateTo('/auth/signin')
    }

    try {
      const user = JSON.parse(userStr)
      console.log(`[Security Middleware] ✅ Session valid for user: ${user.email}`)
    } catch (e) {
      console.warn(`[Security Middleware] Invalid user data, redirecting to login`)
      return navigateTo('/auth/signin')
    }

  } catch (error) {
    console.error('[Security Middleware] Error validating session:', error)
    // On error, redirect to login for safety
    return navigateTo('/auth/signin')
  }
})
