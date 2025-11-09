// FILE: /composables/useInterests.ts - CREATE
// Interests management composable
// ============================================================================

import { ref } from 'vue'
import type { ListInterestsResponse, UserInterestsResponse, InterestResponse } from '~/types/interests'

export const useInterests = () => {
  const interestsStore = useInterestsStore()
  
  const loading = ref(false)
  const error = ref('')

  /**
   * Get all available interests
   */
  const listInterests = async (category?: string) => {
    try {
      loading.value = true
      error.value = ''

      let url = '/api/interests/list'
      if (category) {
        url += `?category=${category}`
      }

      const response = await $fetch<ListInterestsResponse>(url, {
        method: 'GET'
      })

      if (!response.success) {
        throw new Error('Failed to fetch interests')
      }

      // Update store
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
   * Get user's interests
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

      // Update store
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
   * Add interest to user
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

      // Refresh user interests
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
   * Remove interest from user
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

      // Refresh user interests
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

  return {
    loading,
    error,
    listInterests,
    getUserInterests,
    addInterest,
    removeInterest
  }
}
