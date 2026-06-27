// FILE: /composables/use-status.ts - COMPLETE NEW FILE
// ============================================================================
// STATUS COMPOSABLE
// ✅ NEW: Complete status management composable
// ============================================================================

import { ref, computed } from 'vue'

export const useStatus = () => {
  const statuses = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userStatuses = ref<any[]>([])

  /**
   * Create a new status
   */
  const createStatus = async (content: string, options?: {
    media_type?: string
    media_url?: string
    background_color?: string
    text_color?: string
    expires_at?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useStatus] Creating status:', content)

      const result = await $fetch('/api/status/create', {
        method: 'POST',
        body: {
          content,
          media_type: options?.media_type || 'text',
          media_url: options?.media_url,
          background_color: options?.background_color || '#000000',
          text_color: options?.text_color || '#ffffff',
          expires_at: options?.expires_at
        }
      })

      if (result?.success) {
        console.log('[useStatus] ✅ Status created successfully')
        // Add to statuses list
        if (result.data) {
          statuses.value.unshift(result.data)
        }
        return { success: true, data: result.data }
      }

      throw new Error(result?.message || 'Failed to create status')

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create status'
      console.error('[useStatus] ✗ Error creating status:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get statuses for a specific user
   */
  const getUserStatuses = async (userId: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useStatus] Fetching statuses for user:', userId)

      const result = await $fetch(`/api/status/user/${userId}`)

      if (result?.success) {
        console.log('[useStatus] ✅ User statuses fetched:', result.data?.length || 0)
        userStatuses.value = result.data || []
        return { success: true, data: result.data }
      }

      throw new Error(result?.message || 'Failed to fetch user statuses')

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch user statuses'
      console.error('[useStatus] ✗ Error fetching user statuses:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all statuses (feed)
   */
  const getStatuses = async (limit: number = 20, offset: number = 0) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useStatus] Fetching statuses:', { limit, offset })

      const result = await $fetch('/api/status', {
        query: { limit, offset }
      })

      if (result?.success) {
        console.log('[useStatus] ✅ Statuses fetched:', result.data?.length || 0)
        if (offset === 0) {
          statuses.value = result.data || []
        } else {
          statuses.value.push(...(result.data || []))
        }
        return { success: true, data: result.data, total: result.total }
      }

      throw new Error(result?.message || 'Failed to fetch statuses')

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch statuses'
      console.error('[useStatus] ✗ Error fetching statuses:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a status
   */
  const deleteStatus = async (statusId: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useStatus] Deleting status:', statusId)

      const result = await $fetch(`/api/status/${statusId}`, {
        method: 'DELETE'
      })

      if (result?.success) {
        console.log('[useStatus] ✅ Status deleted successfully')
        // Remove from statuses list
        statuses.value = statuses.value.filter(s => s.id !== statusId)
        return { success: true }
      }

      throw new Error(result?.message || 'Failed to delete status')

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete status'
      console.error('[useStatus] ✗ Error deleting status:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a specific status
   */
  const getStatus = async (statusId: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useStatus] Fetching status:', statusId)

      const result = await $fetch(`/api/status/${statusId}`)

      if (result?.success) {
        console.log('[useStatus] ✅ Status fetched')
        return { success: true, data: result.data }
      }

      throw new Error(result?.message || 'Failed to fetch status')

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch status'
      console.error('[useStatus] ✗ Error fetching status:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Computed properties
   */
  const hasStatuses = computed(() => statuses.value.length > 0)
  const statusCount = computed(() => statuses.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  return {
    // State
    statuses,
    userStatuses,
    loading,
    error,

    // Computed
    hasStatuses,
    statusCount,
    isLoading,
    hasError,

    // Methods
    createStatus,
    getUserStatuses,
    getStatuses,
    deleteStatus,
    getStatus
  }
}
