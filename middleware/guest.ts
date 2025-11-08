// FILE: /middleware/guest.ts - CONSOLIDATED & FIXED
// ============================================================================
// GUEST-ONLY MIDDLEWARE FOR AUTH PAGES
// This is a NON-GLOBAL middleware - only applied to auth routes
// Purpose: Ensure only unauthenticated users can access auth pages
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Guest Middleware] Checking route: ${to.path}`)

  // Check if user is already authenticated
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null

  // If user is authenticated, redirect to feed
  if (token) {
    console.log(`[Guest Middleware] ✓ Authenticated user redirected from ${to.path} to /feed`)
    return navigateTo('/feed')
  }

  console.log(`[Guest Middleware] ✓ Guest user allowed on: ${to.path}`)
})
