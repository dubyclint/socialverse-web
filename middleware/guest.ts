// FILE: /middleware/guest.ts - CREATE
// Middleware for guest-only routes (auth pages)
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token')

  // If user is authenticated, redirect to feed
  if (token) {
    return navigateTo('/feed')
  }
})
