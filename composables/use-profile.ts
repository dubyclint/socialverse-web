// FILE: /composables/use-profile.ts - COMPLETE FIXED VERSION
// ============================================================================
// PROFILE COMPOSABLE - FIXED: Proper API integration
// ✅ FIXED: Uses the API composable methods correctly
// ✅ FIXED: Proper error handling and logging
// ✅ FIXED: Returns data in expected format
// ============================================================================

import { ref } from 'vue'

export const useProfile = () => {
  const loading = ref(false)
  const error = ref('')

  /**
   * Fetch current user profile
   */
  const fetchMyProfile = async () => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useProfile] Fetching my profile...')

      const result = await $fetch('/api/profile/me')

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to fetch profile')
      }

      console.log('[useProfile] ✅ Profile fetched successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to fetch profile'
      error.value = errorMsg
      console.error('[useProfile] ❌ Error:', errorMsg)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch user profile by ID
   */
  const fetchUserProfile = async (userId: string) => {
    loading.value = true
    error.value = ''

    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[useProfile] Fetching profile for user:', userId)

      const result = await $fetch(`/api/profile/${userId}`)

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to fetch profile')
      }

      console.log('[useProfile] ✅ Profile fetched successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to fetch profile'
      error.value = errorMsg
      console.error('[useProfile] ❌ Error:', errorMsg)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update profile
   */
  const updateProfile = async (updates: any) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useProfile] Updating profile...')

      const result = await $fetch('/api/profile/update', {
        method: 'POST',
        body: updates
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update profile')
      }

      console.log('[useProfile] ✅ Profile updated successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to update profile'
      error.value = errorMsg
      console.error('[useProfile] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complete profile
   */
  const completeProfile = async (profileData: any) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useProfile] Completing profile...')

      const result = await $fetch('/api/profile/complete', {
        method: 'POST',
        body: profileData
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to complete profile')
      }

      console.log('[useProfile] ✅ Profile completed successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to complete profile'
      error.value = errorMsg
      console.error('[useProfile] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload avatar
   */
  const uploadAvatar = async (file: File) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useProfile] Uploading avatar...')

      const formData = new FormData()
      formData.append('file', file)

      const result = await $fetch('/api/profile/avatar-upload', {
        method: 'POST',
        body: formData
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to upload avatar')
      }

      console.log('[useProfile] ✅ Avatar uploaded successfully')
      return {
        profile: result.data,
        url: result.url
      }
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to upload avatar'
      error.value = errorMsg
      console.error('[useProfile] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = ''
  }

  return {
    loading,
    error,
    fetchMyProfile,
    fetchUserProfile,
    updateProfile,
    completeProfile,
    uploadAvatar,
    clearError
  }
}
