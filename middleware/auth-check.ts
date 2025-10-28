// middleware/auth-check.ts - SKIP AUTH ROUTES
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // ✅ SKIP MIDDLEWARE ON AUTH ROUTES - NO CHECKS
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email', '/auth/reset-password', '/auth/confirm']
  if (authRoutes.some(route => to.path.startsWith(route))) {
    console.log('[Auth-Check] Skipping auth route:', to.path)
    return
  }

  const user = useSupabaseUser()
  const userStore = useUserStore()

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/terms',
    '/privacy',
    '/about'
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(
    route => to.path === route || to.path.startsWith(route)
  )

  // Allow public routes without authentication
  if (isPublicRoute) {
    return
  }

  // CRITICAL: Check if user has valid ID
  if (!user.value?.id) {
    console.warn('[Auth Middleware] User not authenticated or ID missing, redirecting to login')
    return navigateTo('/auth/login')
  }

  // Ensure profile is loaded
  if (!userStore.profile) {
    console.log('[Auth Middleware] Loading user profile...')
    await userStore.fetchProfile(user.value.id)
  }

  // If profile failed to load, redirect to login
  if (!userStore.profile?.id) {
    console.warn('[Auth Middleware] Failed to load profile, redirecting to login')
    return navigateTo('/auth/login')
  }
})

