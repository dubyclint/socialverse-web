// composables/use-rbac.ts
import { createError } from '#app'

export const useRBAC = () => {
  let _cachedUserStore: any = null // Changed from _cachedAuthStore
  let _cachedRolesStore: any = null

  const getUserStore = async () => {
    if (_cachedUserStore) return _cachedUserStore
    const { useUserStore } = await import('~/stores/user')
    _cachedUserStore = useUserStore()
    return _cachedUserStore
  }

  const getRolesStore = async () => {
    if (_cachedRolesStore) return _cachedRolesStore
    const { useRolesStore } = await import('~/stores/roles')
    _cachedRolesStore = useRolesStore()
    return _cachedRolesStore
  }

  // Update logic to look at userStore.profile instead of authStore.profile
  const getUserRole = (user?: any): string => {
    const userStore = _cachedUserStore
    if (!user && !userStore?.profile) return 'user'
    const profile = user || userStore.profile
    return profile?.role || 'user'
  }

  const rolePermissions: Record<string, string[]> = {
    admin: [
      'posts.moderate', 'posts.delete', 'posts.view',
      'users.view', 'users.suspend', 'users.manage',
      'reports.view', 'reports.resolve'
    ],
    manager: [
      'posts.moderate', 'posts.view',
      'users.view',
      'reports.view', 'reports.resolve'
    ],
    user: []
  }

  const getUserPermissions = (user?: any): string[] => {
    const role = getUserRole(user)
    return rolePermissions[role] ?? []
  }

  // ... Update requireAuthentication ...
  const requireAuthentication = () => {
    const userStore = _cachedUserStore
    if (!userStore?.isAuthenticated) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required.'
      })
    }
  }

  const requireRole = (role: string) => {
    const userRole = getUserRole()
    if (userRole !== role && userRole !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: `Forbidden: ${role} role required.`
      })
    }
  }

  // Route middleware performs the authoritative gate; this is a client-side
  // convenience check applied once the profile is available.
  const requirePermission = (permission: string) => {
    const userStore = _cachedUserStore
    if (!userStore?.profile) return
    const role = getUserRole()
    if (role !== 'admin' && role !== 'manager') {
      throw createError({
        statusCode: 403,
        statusMessage: `Forbidden: missing permission '${permission}'.`
      })
    }
  }

  const assignManagerRole = async (userId: string, _permissions?: string[]) => {
    try {
      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'manager' })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to assign manager role' }
    }
  }

  const removeManagerRole = async (userId: string) => {
    try {
      const supabase = useSupabaseClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to remove manager role' }
    }
  }

  return { getUserStore, getRolesStore, getUserRole, getUserPermissions, requireAuthentication, requireRole, requirePermission, assignManagerRole, removeManagerRole }
}
