export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const rolesStore = useRolesStore()

  // Initialize auth store with error handling
  try {
    await authStore.initialize()
  } catch (error) {
    console.warn('Auth store initialization failed:', error)
  }

  // Initialize roles store with error handling
  try {
    await rolesStore.initialize()
  } catch (error) {
    console.warn('Roles store initialization failed:', error)
  }

  // Set up navigation guards
  addRouteMiddleware('auth-global', (to) => {
    // Skip auth check for public routes
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/signup', '/']
    if (publicRoutes.includes(to.path)) return

    // If Supabase is not available, allow access to public routes only
    if (!authStore.supabaseAvailable) {
      if (!publicRoutes.includes(to.path)) {
        return navigateTo('/auth/login')
      }
      return
    }

    // Check authentication
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
