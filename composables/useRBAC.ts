export const useRBAC = () => {
  const authStore = useAuthStore()
  const rolesStore = useRolesStore()

  // Role hierarchy: admin > manager > user
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    user: 1
  }

  const getUserRole = (user?: any): string => {
    if (!user && !authStore.profile) return 'user'
    const profile = user || authStore.profile
    // ✅ FIX: Ensure role always has a value
    return profile?.role || 'user'
  }

  const hasRole = (requiredRole: string, user?: any): boolean => {
    const userRole = getUserRole(user)
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    return userLevel >= requiredLevel
  }

  const getUserPermissions = (user?: any): string[] => {
    if (!user && !authStore.profile) return []
    const profile = user || authStore.profile
    // ✅ FIX: Return default permissions if none found
    return authStore.permissions || getDefaultPermissions(profile?.role || 'user')
  }

  // ✅ NEW: Default permissions by role
  const getDefaultPermissions = (role: string): string[] => {
    const defaultPerms = {
      admin: ['*'], // All permissions
      manager: ['read', 'write', 'moderate', 'manage_users'],
      user: ['read', 'write', 'comment', 'like']
    }
    return defaultPerms[role] || defaultPerms['user']
  }

  const hasPermission = (permission: string, user?: any): boolean => {
    const userRole = getUserRole(user)
    if (userRole === 'admin') return true
    
    const permissions = getUserPermissions(user)
    return permissions.includes(permission) || permissions.includes('*')
  }

  const hasAnyPermission = (permissionList: string[], user?: any): boolean => {
    return permissionList.some(permission => hasPermission(permission, user))
  }

  const hasAllPermissions = (permissionList: string[], user?: any): boolean => {
    return permissionList.every(permission => hasPermission(permission, user))
  }

  const canAccessRoute = (path: string, user?: any): boolean => {
    const userRole = getUserRole(user)
    
    if (path.startsWith('/admin')) return hasRole('admin', user)
    if (path.startsWith('/manager')) return hasRole('manager', user)
    return true
  }

  const requireRole = (requiredRole: string) => {
    if (!hasRole(requiredRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${requiredRole} role required.`
      })
    }
  }

  const requirePermission = (permission: string) => {
    if (!hasPermission(permission)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${permission} permission required.`
      })
    }
  }

  const requireAuthentication = () => {
    if (!authStore.isAuthenticated) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required.'
      })
    }
  }

  // Manager-specific functions
  const assignManagerRole = async (userId: string, permissions: string[] = []) => {
    requireRole('admin')
    return await authStore.assignManagerRole(userId, permissions)
  }

  const removeManagerRole = async (userId: string) => {
    requireRole('admin')
    return await authStore.removeManagerRole(userId)
  }

  // Utility functions
  const canModerateUser = (targetUserId: string): boolean => {
    if (!authStore.isAuthenticated) return false
    if (authStore.user?.id === targetUserId) return false // Can't moderate self
    
    return hasPermission('users.moderate')
  }

  const canAssignRoles = (): boolean => {
    return hasPermission('users.assign_roles')
  }

  const canViewAnalytics = (): boolean => {
    return hasPermission('analytics.view')
  }

  const canModerateContent = (): boolean => {
    return hasPermission('content.moderate')
  }

  const canHandleReports = (): boolean => {
    return hasPermission('reports.handle')
  }

  return {
    // Core functions
    getUserRole,
    hasRole,
    getUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    requireRole,
    requirePermission,
    requireAuthentication,
    
    // Manager functions
    assignManagerRole,
    removeManagerRole,
    
    // Utility functions
    canModerateUser,
    canAssignRoles,
    canViewAnalytics,
    canModerateContent,
    canHandleReports,
    
    // Constants
    roleHierarchy
  }
}
