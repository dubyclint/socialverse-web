// middleware/rbac.ts - SKIP AUTH ROUTES
export default defineNuxtRouteMiddleware((to) => {
  // ✅ SKIP MIDDLEWARE ON AUTH ROUTES - NO RBAC CHECKS
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/verify-email', '/auth/reset-password', '/auth/confirm']
  if (authRoutes.some(route => to.path.startsWith(route))) {
    console.log('[RBAC] Skipping auth route:', to.path)
    return
  }

  let user = null
  let hasPermission: any = null
  let getUserRole: any = null
  let canAccessRoute: any = null
  const { $i18n } = useNuxtApp()

  // Safely get user with error handling
  try {
    user = useSupabaseUser()
  } catch (error) {
    console.warn('Supabase user check failed in rbac middleware:', error)
    return
  }

  // Skip if user is not authenticated (handled by auth-check)
  if (!user?.value) {
    return
  }

  // Safely get RBAC composable with error handling
  try {
    const rbac = useRBAC()
    hasPermission = rbac.hasPermission
    getUserRole = rbac.getUserRole
    canAccessRoute = rbac.canAccessRoute
  } catch (error) {
    console.warn('RBAC composable not available:', error)
    return
  }

  // Safely get user role with error handling
  let userRole = 'user'
  try {
    userRole = getUserRole(user.value)
  } catch (error) {
    console.warn('Failed to get user role:', error)
    userRole = 'user'
  }

  // Safely check route access with error handling
  let canAccess = false
  try {
    canAccess = canAccessRoute(to.path, userRole)
  } catch (error) {
    console.warn('Failed to check route access:', error)
    return
  }

  if (!canAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: $i18n?.t('permissions.denied') || 'Access Denied',
      data: {
        requiredRole: getRequiredRoleForRoute(to.path),
        userRole: userRole,
        path: to.path
      }
    })
  }
})

// Helper function to get required role for a route
function getRequiredRoleForRoute(path: string): string {
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/manager')) return 'manager'
  return 'user'
}

