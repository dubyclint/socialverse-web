// FILE: /middleware/guest.ts - GUEST-ONLY MIDDLEWARE
// ============================================================================
// NON-GLOBAL MIDDLEWARE - Applied to auth routes via definePageMeta
// Purpose: Ensure only unauthenticated users can access auth pages
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Guest Middleware] Checking route: ${to.path}`)

  try {
    // Check if user is already authenticated
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    // If authenticated user tries to access auth pages, redirect to feed
    if (token) {
      console.log(`[Guest Middleware] ✓ Authenticated user redirected from ${to.path} to /feed`)
      return navigateTo('/feed')
    }

    console.log(`[Guest Middleware] ✓ Unauthenticated user allowed on: ${to.path}`)
  } catch (error) {
    console.error(`[Guest Middleware] Error:`, error)
  }
})
