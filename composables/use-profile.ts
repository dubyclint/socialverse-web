// ============================================================================
// FILE: /composables/use-profile.ts
// PHASE 3: Profile Composable
// ============================================================================
// Features:
// ✅ Fetch profile by username
// ✅ Fetch current user profile
// ✅ Update profile information
// ✅ Upload avatar
// ✅ Follow/unfollow user
// ✅ Error handling
// ✅ Loading states
// ============================================================================

import { ref, computed } from 'vue'
import { useProfileStore } from '~/stores/profile'
import { useAuthStore } from '~/stores/auth'

/**
 * Profile data interface
 */
export interface Profile {
  id: string
  username: string
  full_name: string
  bio?: string
  avatar_url?: string
  email: string
  is_verified: boolean
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  updated_at: string
}

/**
 * Profile composable for managing profile operations
 */
export const useProfile = () => {
  const profileStore = useProfileStore()
  const authStore = useAuthStore()

  // ============================================================================
  // STATE
  // ============================================================================
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isFollowing = ref(false)

  // ============================================================================
  // COMPUTED
  // ============================================================================

  /**
   * Get current profile from store
   */
  const currentProfile = computed(() => profileStore.profile)

  /**
   * Check if profile is loading
   */
  const isLoading = computed(() => loading.value)

  /**
   * Get error message
   */
  const errorMessage = computed(() => error.value)

  // ============================================================================
  // METHODS - FETCH PROFILE
  // ============================================================================

  /**
   * Fetch profile by username
   */
  const fetchProfileByUsername = async (username: string): Promise<Profile | null> => {
    try {
      console.log('[useProfile] Fetching profile for username:', username)
      loading.value = true
      error.value = null

      // Validate username
      if (!username || username.trim() === '') {
        throw new Error('Username is required')
      }

      // Fetch profile
      const response = await fetch(`/api/profile/${encodeURIComponent(username)}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User @${username} not found`)
        }
        throw new Error(`Failed to fetch profile (${response.status})`)
      }

      const data = await response.json()

      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }

      console.log('[useProfile] ✅ Profile fetched:', data.data.username)
      return data.data
    } catch (err: any) {
      console.error('[useProfile] Error fetching profile:', err)
      error.value = err.message || 'Failed to fetch profile'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch current user profile
   */
  const fetchCurrentProfile = async (): Promise<Profile | null> => {
    try {
      console.log('[useProfile] Fetching current user profile')
      loading.value = true
      error.value = null

      // Check if profile is already in store
      if (profileStore.profile) {
        console.log('[useProfile] Profile already in store')
        return profileStore.profile
      }

      // Fetch from API
      const response = await fetch('/api/user/profile')

      if (!response.ok) {
        throw new Error(`Failed to fetch profile (${response.status})`)
      }

      const data = await response.json()

      if (!data.data) {
        throw new Error('No profile data returned')
      }

      // Update store
      profileStore.setProfile(data.data)

      console.log('[useProfile] ✅ Current profile fetched and stored')
      return data.data
    } catch (err: any) {
      console.error('[useProfile] Error fetching current profile:', err)
      error.value = err.message || 'Failed to fetch profile'
      return null
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // METHODS - UPDATE PROFILE
  // ============================================================================

  /**
   * Update profile information
   */
  const updateProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
    try {
      console.log('[useProfile] Updating profile:', updates)
      loading.value = true
      error.value = null

      // Validate required fields
      if (updates.full_name !== undefined && !updates.full_name?.trim()) {
        throw new Error('Full name is required')
      }

      if (updates.username !== undefined && !updates.username?.trim()) {
        throw new Error('Username is required')
      }

      // Send update request
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const data = await response.json()

      if (!data.data) {
        throw new Error('No profile data returned')
      }

      // Update store
      profileStore.setProfile(data.data)

      console.log('[useProfile] ✅ Profile updated')
      return data.data
    } catch (err: any) {
      console.error('[useProfile] Error updating profile:', err)
      error.value = err.message || 'Failed to update profile'
      return null
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // METHODS - AVATAR UPLOAD
  // ============================================================================

  /**
   * Upload avatar
   */
  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      console.log('[useProfile] Uploading avatar:', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      loading.value = true
      error.value = null

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit.')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload
      const response = await fetch('/api/profile/avatar-upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload avatar')
      }

      const data = await response.json()

      if (!data.success || !data.url) {
        throw new Error('Invalid upload response')
      }

      // Update store
      if (profileStore.profile) {
        profileStore.setProfile({
          ...profileStore.profile,
          avatar_url: data.url
        })
      }

      console.log('[useProfile] ✅ Avatar uploaded:', data.url)
      return data.url
    } catch (err: any) {
      console.error('[useProfile] Error uploading avatar:', err)
      error.value = err.message || 'Failed to upload avatar'
      return null
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // METHODS - FOLLOW/UNFOLLOW
  // ============================================================================

  /**
   * Follow user
   */
  const followUser = async (userId: string): Promise<boolean> => {
    try {
      console.log('[useProfile] Following user:', userId)
      loading.value = true
      error.value = null

      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to follow user')
      }

      isFollowing.value = true
      console.log('[useProfile] ✅ User followed')
      return true
    } catch (err: any) {
      console.error('[useProfile] Error following user:', err)
      error.value = err.message || 'Failed to follow user'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Unfollow user
   */
  const unfollowUser = async (userId: string): Promise<boolean> => {
    try {
      console.log('[useProfile] Unfollowing user:', userId)
      loading.value = true
      error.value = null

      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to unfollow user')
      }

      isFollowing.value = false
      console.log('[useProfile] ✅ User unfollowed')
      return true
    } catch (err: any) {
      console.error('[useProfile] Error unfollowing user:', err)
      error.value = err.message || 'Failed to unfollow user'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if following user
   */
  const checkFollowStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log('[useProfile] Checking follow status for user:', userId)

      const response = await fetch(`/api/users/${userId}/follow-status`)

      if (!response.ok) {
        throw new Error('Failed to check follow status')
      }

      const data = await response.json()
      isFollowing.value = data.is_following || false

      console.log('[useProfile] Follow status:', isFollowing.value)
      return isFollowing.value
    } catch (err: any) {
      console.error('[useProfile] Error checking follow status:', err)
      return false
    }
  }

  // ============================================================================
  // METHODS - UTILITY
  // ============================================================================

  /**
   * Clear profile data
   */
  const clearProfile = () => {
    console.log('[useProfile] Clearing profile')
    profileStore.clearProfile()
    error.value = null
    isFollowing.value = false
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    // State
    loading,
    error,
    isFollowing,

    // Computed
    currentProfile,
    isLoading,
    errorMessage,

    // Methods - Fetch
    fetchProfileByUsername,
    fetchCurrentProfile,

    // Methods - Update
    updateProfile,

    // Methods - Avatar
    uploadAvatar,

    // Methods - Follow
    followUser,
    unfollowUser,
    checkFollowStatus,

    // Methods - Utility
    clearProfile,
    clearError
  }
}
