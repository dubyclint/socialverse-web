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
    return _cachedRolesStore
  }

  // Update logic to look at userStore.profile instead of authStore.profile
  const getUserRole = (user?: any): string => {
    const userStore = _cachedUserStore
    if (!user && !userStore?.profile) return 'user'
    const profile = user || userStore.profile
    return profile?.role || 'user'
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

  // ... update assignManagerRole and removeManagerRole to call userStore methods ...
  return { /* ... exports ... */ }
}
