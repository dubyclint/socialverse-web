// ============================================================================
// FILE 4: /middleware/auth.ts - COMPLETE AUTH MIDDLEWARE
// ============================================================================
// FIXES:
// ✅ Create auth middleware to protect routes
// ✅ Redirect unauthenticated users to login
// ✅ Allow public routes (login, signup, etc.)
// ✅ Check if user is authenticated before accessing protected routes
// ============================================================================

export default defineRouteMiddleware(async (to, from) => {
  console.log('[Auth Middleware] ============ ROUTE CHECK START ============')
  console.log('[Auth Middleware] Navigating from:', from.path)
  console.log('[Auth Middleware] Navigating to:', to.path)

  // ============================================================================
  // GET AUTH STORE
  // ============================================================================
  const authStore = useAuthStore()

  console.log('[Auth Middleware] Auth store state:', {
    isAuthenticated: authStore.isAuthenticated,
    isHydrated: authStore.isHydrated,
    userId: authStore.user?.id
  })

  // ============================================================================
  // DEFINE PUBLIC ROUTES - No authentication required
  // ============================================================================
  const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/terms-and-policy',
    '/privacy-policy',
    '/'
  ]

  // ============================================================================
  // DEFINE PROTECTED ROUTES - Authentication required
  // ============================================================================
  const protectedRoutes = [
    '/feed',
    '/profile',
    '/settings',
    '/notifications',
    '/messages',
    '/inbox',
    '/chat',
    '/explore',
    '/match',
    '/wallet',
    '/admin'
  ]

  // ============================================================================
  // CHECK IF ROUTE IS PUBLIC
  // ============================================================================
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return to.path === '/'
    }
    return to.path.startsWith(route)
  })

  console.log('[Auth Middleware] Is public route:', isPublicRoute)

  // ============================================================================
  // CHECK IF ROUTE IS PROTECTED
  // ============================================================================
  const isProtectedRoute = protectedRoutes.some(route => {
    return to.path.startsWith(route)
  })

  console.log('[Auth Middleware] Is protected route:', isProtectedRoute)

  // ============================================================================
  // WAIT FOR AUTH STORE TO HYDRATE
  // ============================================================================
  if (!authStore.isHydrated) {
    console.log('[Auth Middleware] Auth store not hydrated, waiting...')
    
    // Wait for hydration with timeout
    let attempts = 0
    const maxAttempts = 50 // 5 seconds with 100ms intervals
    
    while (!authStore.isHydrated && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }

    if (!authStore.isHydrated) {
      console.warn('[Auth Middleware] ⚠️ Auth store hydration timeout')
    } else {
      console.log('[Auth Middleware] ✅ Auth store hydrated after', attempts * 100, 'ms')
    }
  }

  console.log('[Auth Middleware] Auth store hydrated:', authStore.isHydrated)
  console.log('[Auth Middleware] User authenticated:', authStore.isAuthenticated)

  // ============================================================================
  // HANDLE PUBLIC ROUTES
  // ============================================================================
  if (isPublicRoute) {
    console.log('[Auth Middleware] Public route - allowing access')

    // If user is already authenticated and trying to access login/signup, redirect to feed
    if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/signup')) {
      console.log('[Auth Middleware] User already authenticated, redirecting to feed')
      console.log('[Auth Middleware] ============ ROUTE CHECK END ============')
      return navigateTo('/feed')
    }

    console.log('[Auth Middleware] ✅ Public route access allowed')
    console.log('[Auth Middleware] ============ ROUTE CHECK END ============')
    return
  }

  // ============================================================================
  // HANDLE PROTECTED ROUTES
  // ============================================================================
  if (isProtectedRoute) {
    console.log('[Auth Middleware] Protected route - checking authentication...')

    if (!authStore.isAuthenticated) {
      console.warn('[Auth Middleware] ⚠️ User not authenticated, redirecting to login')
      console.log('[Auth Middleware] ============ ROUTE CHECK END ============')
      return navigateTo('/login')
    }

    if (!authStore.user) {
      console.warn('[Auth Middleware] ⚠️ No user data, redirecting to login')
      console.log('[Auth Middleware] ============ ROUTE CHECK END ============')
      return navigateTo('/login')
    }

    console.log('[Auth Middleware] ✅ User authenticated, allowing access')
    console.log('[Auth Middleware] User ID:', authStore.user.id)
    console.log('[Auth Middleware] ============ ROUTE CHECK END ============')
    return
  }

  // ============================================================================
  // HANDLE UNKNOWN ROUTES
  // ============================================================================
  console.log('[Auth Middleware] Unknown route type - allowing access')
  console.log('[Auth Middleware] ============ ROUTE CHECK END ============')
})
