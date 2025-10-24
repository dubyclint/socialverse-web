/**
 * ✅ FIXED - Auth Middleware (Non-Global)
 * This middleware is NOT global, so it only runs on routes that explicitly use it
 * Homepage and public routes are NOT affected
 */

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token')

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
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
    console.warn(`[Auth Middleware] Unauthorized access to ${to.path}, redirecting to login`)
    return navigateTo('/auth/login')
  }

  // If token exists and trying to access auth pages, redirect to feed
  if (token && (to.path === '/auth/login' || to.path === '/auth/signup')) {
    console.log(`[Auth Middleware] Already authenticated, redirecting from ${to.path} to feed`)
    return navigateTo('/feed')
  }
})

function decodeToken(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Token decode error:', error)
    return null
  }
}
                                         
