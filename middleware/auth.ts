// FILE: /middleware/auth.ts - GLOBAL AUTH MIDDLEWARE
// ============================================================================
// GLOBAL MIDDLEWARE - Applied to all routes
// Purpose: Protect routes that require authentication
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Auth Middleware] Checking route: ${to.path}`)

  // Define routes that are PUBLIC (don't require authentication)
  const publicRoutes = [
    '/',
    '/login',
    '/auth',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/confirm',
    '/terms',
    '/privacy',
    '/about',
  ]

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    to.path === route || to.path.startsWith(route + '/')
  )

  // If it's a public route, allow access without authentication
  if (isPublicRoute) {
    console.log(`[Auth Middleware] ✓ Public route allowed: ${to.path}`)
    return
  }

  // For protected routes, check if user has a valid auth token
  try {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null

    if (!token) {
      console.warn(`[Auth Middleware] ✗ Unauthorized access to protected route: ${to.path}`)
      return navigateTo('/auth/signin')
    }

    console.log(`[Auth Middleware] ✓ Authenticated user accessing: ${to.path}`)
  } catch (error) {
    console.error(`[Auth Middleware] Error checking auth:`, error)
    return navigateTo('/auth/signin')
  }
})
