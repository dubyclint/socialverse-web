export const useRBAC = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Role hierarchy: admin > manager > user
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    user: 1
  }

  // Permission mappings for each role
  const rolePermissions = {
    admin: [
      'admin.all',
      'manager.all', 
      'user.all',
      'users.manage',
      'users.assign_roles',
      'content.moderate',
      'reports.handle',
      'analytics.view',
      'system.configure'
    ],
    manager: [
      'manager.all',
      'user.all', 
      'users.moderate',
      'users.suspend',
      'users.warn',
      'content.moderate',
      'reports.handle',
      'analytics.view'
    ],
    user: [
      'user.all',
      'posts.create',
      'posts.edit.own',
      'profile.edit.own',
      'comments.create'
    ]
  }

  const getUserRole = (userProfile: any): string => {
    if (!userProfile) return 'user'
    return userProfile.role || 'user'
  }

  const hasRole = (userRole: string, requiredRole: string): boolean => {
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    return userLevel >= requiredLevel
  }

  const getUserPermissions = (userProfile: any): string[] => {
    const role = getUserRole(userProfile)
    return rolePermissions[role] || rolePermissions.user
  }

  const hasPermission = (userProfile: any, permission: string): boolean => {
    const permissions = getUserPermissions(userProfile)
    return permissions.includes(permission) || permissions.includes('admin.all')
  }

  const hasAnyPermission = (userProfile: any, permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(userProfile, permission))
  }

  const hasAllPermissions = (userProfile: any, permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(userProfile, permission))
  }

  const canAccessRoute = (path: string, userRole: string): boolean => {
    if (path.startsWith('/admin')) return hasRole(userRole, 'admin')
    if (path.startsWith('/manager')) return hasRole(userRole, 'manager')
    return true
  }

  const requireRole = (requiredRole: string) => {
    const authStore = useAuthStore()
    const userRole = getUserRole(authStore.profile)
    
    if (!hasRole(userRole, requiredRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${requiredRole} role required.`
      })
    }
  }

  const requirePermission = (permission: string) => {
    const authStore = useAuthStore()
    
    if (!hasPermission(authStore.profile, permission)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${permission} permission required.`
      })
    }
  }

  // Manager-specific functions
  const assignManagerRole = async (userId: string, permissions: string[] = []) => {
    requireRole('admin')
    
    try {
      // Update user role to manager
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ 
          role: 'manager',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (roleError) throw roleError

      // Log the role assignment
      await logAuditAction('manager_assigned', 'user', userId, {
        permissions,
        assigned_by: user.value?.id
      })

      return { success: true }
    } catch (error) {
      console.error('Manager assignment error:', error)
      return { success: false, error: error.message }
    }
  }

  const removeManagerRole = async (userId: string) => {
    requireRole('admin')
    
    try {
      // Update user role back to user
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ 
          role: 'user',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (roleError) throw roleError

      // Log the role removal
      await logAuditAction('manager_removed', 'user', userId, {
        removed_by: user.value?.id
      })

      return { success: true }
    } catch (error) {
      console.error('Manager removal error:', error)
      return { success: false, error: error.message }
    }
  }

  const logAuditAction = async (action: string, resourceType: string, resourceId: string, details: any = {}) => {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.value?.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Audit log error:', error)
    }
  }

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }

  return {
    getUserRole,
    hasRole,
    getUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    requireRole,
    requirePermission,
    assignManagerRole,
    removeManagerRole,
    logAuditAction,
    roleHierarchy,
    rolePermissions
  }
}

