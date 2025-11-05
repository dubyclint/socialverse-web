// middleware/session-check.ts
// Session check middleware - FIXED VERSION
// Uses custom Supabase plugin instead of auto-imports

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip for auth routes
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email', '/auth/reset-password', '/auth/confirm']
  if (authRoutes.some(route => to.path.startsWith(route))) {
    return
  }

  // Skip for public routes
  const publicRoutes = ['/', '/explore', '/feed']
  if (publicRoutes.some(route => to.path === route || to.path.startsWith(route))) {
    return
  }

  // Only check session on client side
  if (process.server) {
    return
  }

  try {
    // Get auth token from localStorage (using auth store instead of Supabase)
    const authStore = useAuthStore()
    
    // If no token and not on public route, redirect to login
    if (!authStore.isAuthenticated && !publicRoutes.some(route => to.path === route)) {
      return navigateTo('/auth/login')
    }
  } catch (error) {
    console.error('[session-check] Middleware error:', error)
    // Don't break the app if middleware fails
    return
  }
})
