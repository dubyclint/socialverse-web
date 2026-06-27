// ============================================================================
// FILE: /composables/use-user.ts
// Description: User data composable - integrates auth store context and backend 
//              profile operations with runtime dynamic dependency resolution.
// ============================================================================
import { ref, computed } from 'vue'

export const useUser = () => {
  // ============================================================================
  // LAZY STORE RESOLVER (Prevents module-level graph dependency loops)
  // ============================================================================
  let _cachedAuthStore: any = null

  const getAuthStore = async () => {
    if (_cachedAuthStore) return _cachedAuthStore
    const { useAuthStore } = await import('~/stores/auth')
    _cachedAuthStore = useAuthStore()
    return _cachedAuthStore
  }

  const getAuthStoreSync = () => _cachedAuthStore

  // ============================================================================
  // REACTIVE STATE & COMPUTEDS
  // ============================================================================
  const profile = ref<any>(null)
  const loading = ref(false)
  const error = ref('')

  const user = computed(() => getAuthStoreSync()?.user || null)
  const isAuthenticated = computed(() => !!getAuthStoreSync()?.token)

  // ============================================================================
  // CORE API ACTIONS
  // ============================================================================

  /**
   * Fetch the active user's profile metadata directly from the internal API engine
   */
  const fetchUserProfile = async () => {
    const authStore = await getAuthStore()
    if (!isAuthenticated.value) return
    
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch<any>('/api/users/profile', {
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : undefined
      })
      profile.value = response
    } catch (err: any) {
      error.value = err?.message || 'An unknown network error occurred while fetching profile data records.'
      console.error('[useUser] Failed to fetch user profile:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Post updated identity information payloads back up to database storage layers
   */
  const updateUserProfile = async (data: any) => {
    const authStore = await getAuthStore()
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch<any>('/api/users/profile', {
        method: 'PUT',
        headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : undefined,
        body: data
      })
      profile.value = response
      return response
    } catch (err: any) {
      error.value = err?.message || 'An unknown network error occurred while writing profile updates.'
      console.error('[useUser] Failed to update user profile:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Gracefully seed the micro-store tracking map on client lifecycles
  if (process.client) {
    getAuthStore().catch(() => console.warn('[useUser] Auth store allocation deferred.'))
  }

  return {
    user,
    isAuthenticated,
    profile,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile
  }
}
