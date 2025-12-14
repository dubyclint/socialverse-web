// FILE: /middleware/security-middleware.ts (CORRECTED)
// ============================================================================
// SECURITY MIDDLEWARE - FIXED: Proper imports
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  try {
    console.log('[Security Middleware] Checking route:', to.path)
    
    // Add security checks here
    // This middleware is applied via definePageMeta
  } catch (error) {
    console.error('[Security Middleware] Error:', error)
  }
})
