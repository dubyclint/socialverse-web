export const useRBAC = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Role hierarchy: admin > manager > user
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    user: 1
  }

  // Permission mappings
  const rolePermissions = {
    admin: [
      'admin.all',
      'manager.all', 
      'user.all',
      'posts.create',
      'posts.edit',
      'posts.delete',
      'users.manage',
      'analytics.view'
    ],
    manager: [
      'manager.all',
      'user.all', 
      'posts.moderate',
      'users.view',
      'reports.handle'
    ],
    user: [
      'user.all',
      'posts.create',
      'posts.edit.own',
      'profile.edit.own'
    ]
  }

  const getUserRole = (user: any): string => {
    if (!user) return 'user'
    return user.user_metadata?.role || user.app_metadata?.role || 'user'
  }

  const hasRole = (userRole: string, requiredRole: string): boolean => {
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    return userLevel >= requiredLevel
  }

  const getUserPermissions = (user: any): string[] => {
    const role = getUserRole(user)
    return rolePermissions[role] || rolePermissions.user
  }

  const hasPermission = (userPermissions: string[], permission: string): boolean => {
    return userPermissions.includes(permission) || userPermissions.includes('admin.all')
  }

  const canAccessRoute = (path: string, userRole: string): boolean => {
    if (path.startsWith('/admin')) return hasRole(userRole, 'admin')
    if (path.startsWith('/manager')) return hasRole(userRole, 'manager')
    return true
  }

  const requireRole = (requiredRole: string) => {
    const userRole = getUserRole(user.value)
    if (!hasRole(userRole, requiredRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${requiredRole} role required.`
      })
    }
  }

  const requirePermission = (permission: string) => {
    const permissions = getUserPermissions(user.value)
    if (!hasPermission(permissions, permission)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${permission} permission required.`
      })
    }
  }

  return {
    getUserRole,
    hasRole,
    getUserPermissions,
    hasPermission,
    canAccessRoute,
    requireRole,
    requirePermission,
    roleHierarchy,
    rolePermissions
  }
}
