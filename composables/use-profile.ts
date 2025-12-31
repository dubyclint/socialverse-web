import { ref } from 'vue'
import type { Profile } from '~/stores/profile'

export const useProfile = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const profile = ref<Profile | null>(null)

  /**
   * Fetch profile by username
   */
  const fetchProfile = async (username: string): Promise<Profile | null> => {
    loading.value = true
    error.value = null

    try {
      console.log('[useProfile] Fetching profile for user:', username)

      const { data, error: fetchError } = await useFetch(`/api/profile/${username}`)

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Failed to fetch profile')
      }

      if (!data.value?.data) {
        throw new Error('User not found')
      }

      // Ensure all fields have defaults
      const profileData: Profile = {
        is_verified: false,
        verification_status: 'unverified',
        profile_completed: false,
        email: null,
        avatar_url: null,
        bio: null,
        ...data.value.data
      }

      profile.value = profileData
      console.log('[useProfile] ✅ Profile fetched:', profileData.username)
      return profileData
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch profile'
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
  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      console.log('[useProfile] Updating profile:', updates)

      const { data, error: updateError } = await useFetch('/api/profile/update', {
        method: 'POST',
        body: updates
      })

      if (updateError.value) {
        throw new Error(updateError.value.message || 'Failed to update profile')
      }

      if (profile.value) {
        profile.value = { ...profile.value, ...updates }
      }

      console.log('[useProfile] ✅ Profile updated')
      return true
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update profile'
      error.value = errorMsg
      console.error('[useProfile] ❌ Error:', errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear profile
   */
  const clearProfile = () => {
    profile.value = null
    error.value = null
    console.log('[useProfile] ✅ Profile cleared')
  }

  return {
    loading,
    error,
    profile,
    fetchProfile,
    updateProfile,
    clearProfile
  }
}
