export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  // Initialize auth store with error handling
  try {
    await authStore.initialize()
  } catch (error) {
    console.warn('Auth store initialization failed:', error)
  }

  // Set up navigation guards - but don't redirect on homepage
  addRouteMiddleware('auth-global', (to) => {
    // Always allow public routes
    const publicRoutes = [
      '/',
      '/auth',
      '/auth/login',
      '/auth/register',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/verify-email',
      '/about',
      '/features',
      '/pricing',
      '/blog',
      '/terms',
      '/privacy'
    ]

    const isPublicRoute = publicRoutes.some(route =>
      to.path === route || to.path.startsWith(route + '/')
    )

    // Allow all public routes without auth check
    if (isPublicRoute) {
      return
    }

    // For protected routes, check authentication
    if (!authStore.isAuthenticated) {
      return navigateTo('/auth/login')
    }

    // Check account status
    if (authStore.isAccountSuspended || authStore.isAccountBanned) {
      return navigateTo('/auth/suspended')
    }

    // Check role-based access
    if (!authStore.canAccessRoute(to.path)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }
  }, { global: true })
})
