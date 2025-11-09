// FILE: /composables/useProfile.ts - CREATE
// Profile management composable
// ============================================================================

import { ref } from 'vue'
import type { CompleteProfileRequest, UpdateProfileRequest, ProfileResponse, AvatarUploadResponse } from '~/types/profile'

export const useProfile = () => {
  const profileStore = useProfileStore()
  const router = useRouter()
  
  const loading = ref(false)
  const error = ref('')

  /**
   * Complete profile after email verification
   */
  const completeProfile = async (data: CompleteProfileRequest) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<ProfileResponse>('/api/profile/complete', {
        method: 'POST',
        body: data
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to complete profile')
      }

      // Update store
      if (response.profile) {
        profileStore.setProfile(response.profile)
      }

      return {
        success: true,
        nextStep: response.nextStep
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to complete profile'
      console.error('[useProfile] Complete profile error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get current user profile
   */
  const getProfile = async () => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch('/api/profile/me', {
        method: 'GET'
      })

      if (!response.success) {
        throw new Error('Failed to fetch profile')
      }

      // Update store
      if (response.data) {
        profileStore.setProfileData(response.data)
      }

      return {
        success: true,
        data: response.data
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch profile'
      console.error('[useProfile] Get profile error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update profile
   */
  const updateProfile = async (data: UpdateProfileRequest) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<ProfileResponse>('/api/profile/update', {
        method: 'POST',
        body: data
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile')
      }

      // Update store
      if (response.profile) {
        profileStore.setProfile(response.profile)
      }

      return {
        success: true,
        profile: response.profile
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile'
      console.error('[useProfile] Update profile error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload avatar
   */
  const uploadAvatar = async (file: File) => {
    try {
      loading.value = true
      error.value = ''

      const formData = new FormData()
      formData.append('file', file)

      const response = await $fetch<AvatarUploadResponse>('/api/profile/avatar-upload', {
        method: 'POST',
        body: formData
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to upload avatar')
      }

      return {
        success: true,
        avatarUrl: response.avatarUrl
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to upload avatar'
      console.error('[useProfile] Upload avatar error:', err)
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
    completeProfile,
    getProfile,
    updateProfile,
    uploadAvatar
  }
}
