// middleware/rbac.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const { hasPermission, getUserRole, canAccessRoute } = useRBAC()
  const { $i18n } = useNuxtApp()
  
  // Skip if user is not authenticated (handled by auth-check)
  if (!user.value) {
    return
  }
  
  const userRole = getUserRole(user.value)
  const canAccess = canAccessRoute(to.path, userRole)
  
  if (!canAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: $i18n.t('permissions.denied'),
      data: {
        requiredRole: getRequiredRoleForRoute(to.path),
        userRole: userRole,
        path: to.path
      }
    })
  }
})

// Helper function to determine required role for route
function getRequiredRoleForRoute(path: string): string {
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/manager')) return 'manager'
  return 'user'
}
