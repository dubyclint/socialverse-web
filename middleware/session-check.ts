// middleware/session-check.ts
// Session check middleware - FIXED VERSION
// Safely checks Supabase session without breaking app initialization

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip for auth routes - don't check session on login/signup pages
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
    // Try to get Supabase client and user
    // These might not be available during app initialization
    let supabase = null
    let user = null

    try {
      supabase = useSupabaseClient()
      user = useSupabaseUser()
    } catch (error) {
      console.warn('[session-check] Supabase not ready yet:', error.message)
      return
    }

    // If no user and not on public route, redirect to login
    if (!user?.value && !publicRoutes.some(route => to.path === route)) {
      return navigateTo('/auth/login')
    }
  } catch (error) {
    console.error('[session-check] Middleware error:', error)
    // Don't break the app if middleware fails
    return
  }
})
