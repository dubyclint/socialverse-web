// FILE: /middleware/auth-guard.ts - UPDATE
// Middleware for protected routes
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return

  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token')

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth',
    '/auth/signin',
    '/auth/login',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/terms',
    '/privacy',
    '/'
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  // If route requires auth and user is not authenticated
  if (!isPublicRoute && !token) {
    return navigateTo('/auth/signin')
  }

  // If user is authenticated and trying to access auth pages
  if (isPublicRoute && token && to.path.startsWith('/auth')) {
    return navigateTo('/feed')
  }
})
