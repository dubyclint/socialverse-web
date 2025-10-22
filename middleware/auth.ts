/**
 * ✅ FIXED - Global Auth Middleware
 * Handles route protection and authentication checks
 * This middleware runs on every route navigation
 */

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token')
  const user = localStorage.getItem('user')

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

  // Define routes that require authentication
  const protectedRoutes = [
    '/feed',
    '/profile',
    '/settings',
    '/inbox',
    '/notifications',
    '/admin',
    '/manager',
    '/my-pocket',
    '/chat',
    '/groups',
    '/posts',
    '/explore',
    '/trade',
    '/p2p',
    '/cross-meet',
    '/universe',
    '/support',
  ]

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => to.path === route || to.path.startsWith(route))

  // ✅ RULE 1: If no token and trying to access protected route, redirect to login
  if (!token && isProtectedRoute) {
    console.warn(`[Auth Middleware] Unauthorized access to ${to.path}, redirecting to login`)
    return navigateTo('/auth/login')
  }

  // ✅ RULE 2: If token exists and trying to access auth pages, redirect to feed
  if (token && (to.path === '/auth/login' || to.path === '/auth/signup')) {
    console.log(`[Auth Middleware] Already authenticated, redirecting from ${to.path} to feed`)
    return navigateTo('/feed')
  }

  // ✅ RULE 3: Validate token expiration
  if (token) {
    try {
      const decoded = decodeToken(token)
      
      if (decoded && decoded.exp) {
        const expirationTime = decoded.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()

        // If token is expired, clear storage and redirect to login
        if (currentTime > expirationTime) {
          console.warn('[Auth Middleware] Token expired, clearing auth data')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          
          if (isProtectedRoute) {
            return navigateTo('/auth/login')
          }
        }
      }
    } catch (error) {
      console.error('[Auth Middleware] Error decoding token:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      if (isProtectedRoute) {
        return navigateTo('/auth/login')
      }
    }
  }

  // ✅ RULE 4: Allow access to public routes
  if (isPublicRoute) {
    return
  }

  // ✅ RULE 5: Default behavior - allow navigation
  return
})

/**
 * Helper function to decode JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null
 */
function decodeToken(token: string): any {
  try {
    // Split token into parts
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))
    
    return decoded
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

                                         
