// ============================================================================
// FILE: /composables/use-interests.ts
// Description: Interests management composable - interfaces with API endpoints 
//              and Pinia state with dynamic runtime import resolution.
// ============================================================================
import { ref } from 'vue'
import type { ListInterestsResponse, UserInterestsResponse, InterestResponse } from '~/types/interests'

export const useInterests = () => {
  // ============================================================================
  // LAZY STORE RESOLVER (Eliminates module-level dependency deadlocks)
  // ============================================================================
  let _cachedInterestsStore: any = null

  const getInterestsStore = async () => {
    if (_cachedInterestsStore) return _cachedInterestsStore
    const { useInterestsStore } = await import('~/stores/interests')
    _cachedInterestsStore = useInterestsStore()
    return _cachedInterestsStore
  }

  // ============================================================================
  // REACTIVE STATE
  // ============================================================================
  const loading = ref(false)
  const error = ref('')

  // ============================================================================
  // CORE INTEREST ACTIONS
  // ============================================================================

  /**
   * Get all available interests
   */
  const listInterests = async (category?: string) => {
    try {
      loading.value = true
      error.value = ''

      let url = '/api/interests/list'
      if (category) {
        url += `?category=${encodeURIComponent(category)}`
      }

      const response = await $fetch<ListInterestsResponse>(url, {
        method: 'GET'
      })

      if (!response.success) {
        throw new Error('Failed to fetch interests')
      }

      // Update store state layers lazily
      const interestsStore = await getInterestsStore()
      interestsStore.setAvailableInterests(response.interests)

      return {
        success: true,
        interests: response.interests,
        grouped: response.grouped,
        total: response.total
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch interests'
      console.error('[useInterests] List interests error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user's active configuration interests
   */
  const getUserInterests = async () => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<UserInterestsResponse>('/api/interests/user', {
        method: 'GET'
      })

      if (!response.success) {
        throw new Error('Failed to fetch user interests')
      }

      // Update store state layers lazily
      const interestsStore = await getInterestsStore()
      interestsStore.setUserInterests(response.interests)

      return {
        success: true,
        interests: response.interests,
        grouped: response.grouped,
        total: response.total
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user interests'
      console.error('[useInterests] Get user interests error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Add an interest attachment record to the active user
   */
  const addInterest = async (interestId: string) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<InterestResponse>('/api/interests/add', {
        method: 'POST',
        body: { interestId }
      })

      if (!response.success) {
        throw new Error('Failed to add interest')
      }

      // Refresh user configuration maps downstream
      await getUserInterests()

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to add interest'
      console.error('[useInterests] Add interest error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove an interest record block from the active profile
   */
  const removeInterest = async (interestId: string) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<InterestResponse>('/api/interests/remove', {
        method: 'POST',
        body: { interestId }
      })

      if (!response.success) {
        throw new Error('Failed to remove interest')
      }

      // Refresh user configuration maps downstream
      await getUserInterests()

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Failed to remove interest'
      console.error('[useInterests] Remove interest error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // Pre-seed matching dependency graph when execution hits client layout loops
  if (process.client) {
    getInterestsStore().catch(() => console.warn('[useInterests] Interests store registration deferred.'))
  }

  return {
    loading,
    error,
    listInterests,
    getUserInterests,
    addInterest,
    removeInterest
  }
}
