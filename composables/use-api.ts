// composables/use-api.ts
import { useNuxtApp } from '#app'
import { computed } from 'vue'

export const useApi = () => {
  const { $fetch } = useNuxtApp()

  // 1. Unified Store Resolver
  let _cachedUserStore: any = null

  const getUserStore = async () => {
    if (_cachedUserStore) return _cachedUserStore
    // Import the unified store
    const { useUserStore } = await import('~/stores/user')
    _cachedUserStore = useUserStore()
    return _cachedUserStore
  }

  // Helper for synchronous checks
  const getActiveUserStoreSync = () => _cachedUserStore

  // 2. Updated Auth Headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const userStore = getActiveUserStoreSync()
    
    // Access token from unified store
    const token = userStore?.token 

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  // 3. Updated User ID Retrieval
  const getUserId = (): string | null => {
    const userStore = getActiveUserStoreSync()
    return userStore?.userId || null
  }

  // 4. Mapped State Objects
  // Using computed properties to ensure reactivity when the store is initialized
  const profile = computed(() => getActiveUserStoreSync()?.profile || null)
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
