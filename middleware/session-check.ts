// middleware/session-check.ts
// Session check middleware - Uses auth store only

export default defineNuxtRouteMiddleware((to) => {
  // Public routes - no auth required
  const publicRoutes = ['/', '/explore', '/auth/login', '/auth/signup', '/TermsAndPolicy']
  
  // Auth routes - only for unauthenticated users
  const authRoutes = ['/auth/login', '/auth/signup']
  
  // Protected routes - require authentication
  const protectedRoutes = ['/feed', '/chat', '/notifications', '/profile', '/my-pocket', '/inbox']

  // Skip on server side
  if (process.server) {
    return
  }

  try {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    // If user is authenticated and trying to access auth pages, redirect to feed
    if (isAuthenticated && authRoutes.some(route => to.path.startsWith(route))) {
      return navigateTo('/feed')
    }

    // If user is NOT authenticated and trying to access protected pages, redirect to login
    if (!isAuthenticated && protectedRoutes.some(route => to.path.startsWith(route))) {
      return navigateTo('/auth/login')
    }
  } catch (error) {
    console.error('[session-check] Middleware error:', error)
    return
  }
})
