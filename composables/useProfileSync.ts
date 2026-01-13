// /composables/useProfileSync.ts
// ============================================================================
// Profile Sync Composable - Real-time profile updates across the app
// ============================================================================

import { ref } from 'vue'

export const useProfileSync = () => {
  const subscriptions = ref<Map<string, any>>(new Map())
  const profileUpdateCallbacks = ref<Map<string, Function[]>>(new Map())

  /**
   * Subscribe to profile updates for a specific user
   */
  const subscribeToProfileUpdates = (userId: string, callback: (profile: any) => void) => {
    console.log('[Profile Sync] Subscribing to updates for user:', userId)

    // Store callback
    if (!profileUpdateCallbacks.value.has(userId)) {
      profileUpdateCallbacks.value.set(userId, [])
    }
    profileUpdateCallbacks.value.get(userId)?.push(callback)

    // Listen for custom events
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail?.id === userId) {
        console.log('[Profile Sync] Profile update received:', event.detail)
        callback(event.detail)
      }
    }

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)

    // Store unsubscribe function
    subscriptions.value.set(userId, () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    })
  }

  /**
   * Unsubscribe from profile updates
   */
  const unsubscribeFromProfileUpdates = (userId?: string) => {
    if (userId) {
      const unsubscribe = subscriptions.value.get(userId)
      if (unsubscribe) {
        unsubscribe()
        subscriptions.value.delete(userId)
      }
    } else {
      // Unsubscribe all
      subscriptions.value.forEach((unsubscribe) => unsubscribe())
      subscriptions.value.clear()
    }
  }

  /**
   * Broadcast profile update to all listeners
   */
  const broadcastProfileUpdate = (profile: any) => {
    console.log('[Profile Sync] Broadcasting profile update:', profile)
    window.dispatchEvent(
      new CustomEvent('profileUpdated', {
        detail: profile,
        bubbles: true,
        composed: true
      })
    )
  }

  /**
   * Fetch and sync profile from API
   */
  const syncProfileFromAPI = async (userId: string) => {
    try {
      console.log('[Profile Sync] Fetching profile from API:', userId)
      const { data } = await $fetch(`/api/profile/${userId}`)
      
      if (data) {
        broadcastProfileUpdate(data)
        return data
      }
    } catch (error) {
      console.error('[Profile Sync] Error fetching profile:', error)
    }
  }

  return {
    subscribeToProfileUpdates,
    unsubscribeFromProfileUpdates,
    broadcastProfileUpdate,
    syncProfileFromAPI
  }
}
