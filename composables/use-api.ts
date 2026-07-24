// composables/use-api.ts
import { computed } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'

export const useApi = () => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()

  // 1. Unified Store Resolver / Compatibility Shim
  let _cachedUserStore: any = null

  const getUserStore = async () => {
    if (_cachedUserStore) return _cachedUserStore
    try {
      const { useUserStore } = await import('~/stores/user')
      _cachedUserStore = useUserStore()
      return _cachedUserStore
    } catch {
      return null
    }
  }

  const getActiveUserStoreSync = () => _cachedUserStore

  // 2. Updated Auth Headers (Cookies handle session automatically; keeping content-type default)
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    return headers
  }

  // 3. Native User ID Retrieval
  const getUserId = (): string | null => {
    return user.value?.id || null
  }

  // 4. Mapped State Objects (Falling back to native session data with store sync if available)
  const profile = computed(() => getActiveUserStoreSync()?.profile || user.value || null)
  const posts = computed(() => getActiveUserStoreSync()?.posts || [])
  const notifications = computed(() => getActiveUserStoreSync()?.notifications || [])

  return { 
    profile, 
    posts, 
    notifications, 
    getUserId, 
    getAuthHeaders, 
    getUserStore 
  }
}
