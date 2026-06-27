// ============================================================================
// FILE: /composables/use-rbac.ts
// Description: Role-Based Access Control (RBAC) validation hook layer
//              decoupled from top-level store dependencies to avoid circular loops.
// ============================================================================
import { createError } from '#app'

export const useRBAC = () => {
  // ============================================================================
  // LAZY STORE RESOLVERS & RESOLVED CACHE
  // ============================================================================
  let _cachedAuthStore: any = null
  let _cachedRolesStore: any = null

  const getAuthStore = async () => {
    if (_cachedAuthStore) return _cachedAuthStore
    const { useAuthStore } = await import('~/stores/auth')
    _cachedAuthStore = useAuthStore()
    return _cachedAuthStore
  }

  const getRolesStore = async () => {
    if (_cachedRolesStore) return _cachedRolesStore
    const { useRolesStore } = await import('~/stores/roles')
    _cachedRolesStore = useRolesStore()
    return _cachedRolesStore
  }

  // Synchronous safety hook fallback for internal pure checks
  const getActiveAuthStoreSync = () => {
    return _cachedAuthStore
  }

  // Role hierarchy mapping index parameters
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    manager: 2,
    user: 1
  }

  /**
   * Safe parser to inspect current fallback state identities
   */
  const getUserRole = (user?: any): string => {
    const authStore = getActiveAuthStoreSync()
    if (!user && !authStore?.profile) return 'user'
    const profile = user || authStore.profile
    return profile?.role || 'user'
  }

  /**
   * Match hierarchy positions to evaluate elevation allowances
   */
  const hasRole = (requiredRole: string, user?: any): boolean => {
    const userRole = getUserRole(user)
    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0
    return userLevel >= requiredLevel
  }

  /**
   * Aggregate active token claim scopes or load default profile settings
   */
  const getUserPermissions = (user?: any): string[] => {
    const authStore = getActiveAuthStoreSync()
    if (!user && !authStore?.profile) return []
    const profile = user || authStore.profile
    return authStore?.permissions || getDefaultPermissions(profile?.role || 'user')
  }

  /**
   * Hard fallbacks mapping default scopes cleanly per user classification
   */
  const getDefaultPermissions = (role: string): string[] => {
    const defaultPerms: Record<string, string[]> = {
      admin: ['*'], 
      manager: ['read', 'write', 'moderate', 'manage_users'],
      user: ['read', 'write', 'comment', 'like']
    }
    return defaultPerms[role] || defaultPerms['user']
  }

  /**
   * Deep equality checks on wildcard bounds or explicit strings
   */
  const hasPermission = (permission: string, user?: any): boolean => {
    const userRole = getUserRole(user)
    if (userRole === 'admin') return true
    
    const permissions = getUserPermissions(user)
    return permissions.includes(permission) || permissions.includes('*')
  }

  /**
   * Evaluate if a user holds at least one permission scope within a list
   */
  const hasAnyPermission = (permissionList: string[], user?: any): boolean => {
    return permissionList.some(permission => hasPermission(permission, user))
  }

  /**
   * Strict validation requiring every specified permission scope to match
   */
  const hasAllPermissions = (permissionList: string[], user?: any): boolean => {
    return permissionList.every(permission => hasPermission(permission, user))
  }

  /**
   * Evaluates directory navigation bounds prior to frontend path switches
   */
  const canAccessRoute = (path: string, user?: any): boolean => {
    if (path.startsWith('/admin')) return hasRole('admin', user)
    if (path.startsWith('/manager')) return hasRole('manager', user)
    return true
  }

  /**
   * Enforces role requirements by throwing a global Nuxt 403 error if invalid
   */
  const requireRole = (requiredRole: string) => {
    if (!hasRole(requiredRole)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${requiredRole} role required.`
      })
    }
  }

  /**
   * Enforces permission requirements by throwing a global Nuxt 403 error if invalid
   */
  const requirePermission = (permission: string) => {
    if (!hasPermission(permission)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. ${permission} permission required.`
      })
    }
  }

  /**
   * Validates authentication state, throwing a global Nuxt 401 error if unauthenticated
   */
  const requireAuthentication = () => {
    const authStore = getActiveAuthStoreSync()
    if (!authStore?.isAuthenticated) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required.'
      })
    }
  }

  /**
   * Administrative proxy pipeline to elevate target profile roles
   */
  const assignManagerRole = async (userId: string, permissions: string[] = []) => {
    await getAuthStore() // Ensure hydrated
    requireRole('admin')
    return await _cachedAuthStore.assignManagerRole(userId, permissions)
  }

  /**
   * Administrative proxy pipeline to demote target management accounts
   */
  const removeManagerRole = async (userId: string) => {
    await getAuthStore() // Ensure hydrated
    requireRole('admin')
    return await _cachedAuthStore.removeManagerRole(userId)
  }

  // ============================================================================
  // TELEMETRY & CONTEXTUAL PROTECTION HELPERS
  // ============================================================================
  const canModerateUser = (targetUserId: string): boolean => {
    const authStore = getActiveAuthStoreSync()
    if (!authStore?.isAuthenticated) return false
    if (authStore.user?.id === targetUserId) return false 
    
    return hasPermission('users.moderate')
  }

  const canAssignRoles = (): boolean => hasPermission('users.assign_roles')
  const canViewAnalytics = (): boolean => hasPermission('analytics.view')
  const canModerateContent = (): boolean => hasPermission('content.moderate')
  const canHandleReports = (): boolean => hasPermission('reports.handle')

  // Setup initial micro-sync lifecycle link without execution locks
  if (process.client) {
    getAuthStore().catch(() => console.warn('[RBAC] Pre-fetching sync deferred.'))
    getRolesStore().catch(() => console.warn('[RBAC] Roles dependency pre-fetching deferred.'))
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
    
    // Constants & Core Hooks
    roleHierarchy,
    getAuthStore,
    getRolesStore
  }
}
