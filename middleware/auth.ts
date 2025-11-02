// FILE: /middleware/auth.ts - FIXED
// Auth Middleware (Non-Global)
// This middleware is NOT global, so it only runs on routes that explicitly use it
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token')

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signin',
    '/auth/signup',
    '/auth',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/confirm',
    '/',
    '/terms',
    '/privacy',
    '/about',
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => to.path === route || to.path.startsWith(route))

  // Allow public routes without token
  if (isPublicRoute) {
    return
  }

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    console.warn(`[Auth Middleware] Unauthorized access attempt to ${to.path}`)
    return navigateTo('/auth/signin')
  }
})
