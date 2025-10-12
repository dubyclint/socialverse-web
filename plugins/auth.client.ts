export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  const rolesStore = useRolesStore()

  // Initialize auth store
  await authStore.initialize()

  // Initialize roles store
  await rolesStore.initialize()

  // Set up navigation guards
  addRouteMiddleware('auth-global', (to) => {
    // Skip auth check for public routes
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/']
    if (publicRoutes.includes(to.path)) return

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
