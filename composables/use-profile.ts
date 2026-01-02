// ============================================================================
// FILE 5: /composables/use-profile.ts - COMPLETE PROFILE COMPOSABLE
// ============================================================================
// FIXES:
// ✅ Create composable to fetch and manage profile data
// ✅ Fetch profile from profiles table
// ✅ Merge with auth store data
// ✅ Provide profile data to components
// ✅ Handle profile updates
// ============================================================================

import { computed, ref } from 'vue'
import type { Profile, ProfileUpdate } from '~/types/auth'

export const useProfile = () => {
  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // COMPUTED PROPERTIES - Profile data accessors
  // ============================================================================

  const profile = computed(() => profileStore.profile)

  const username = computed(() => profileStore.username)

  const displayName = computed(() => profileStore.displayName)

  const avatar = computed(() => profileStore.avatar)

  const email = computed(() => profileStore.email)

  const bio = computed(() => profileStore.bio)

  const location = computed(() => profileStore.location)

  const website = computed(() => profileStore.website)

  const followers = computed(() => profileStore.followers)

  const following = computed(() => profileStore.following)

  const posts = computed(() => profileStore.posts)

  const verified = computed(() => profileStore.verified)

  const isProfileComplete = computed(() => profileStore.isProfileComplete)

  const hasAvatar = computed(() => profileStore.hasAvatar)

  const isLoading = computed(() => profileStore.isLoading || loading.value)

  const isError = computed(() => profileStore.error || error.value)

  // ============================================================================
  // FETCH PROFILE METHOD
  // ============================================================================
  const fetchProfile = async (userId?: string) => {
    console.log('[useProfile] ============ FETCH PROFILE START ============')
    console.log('[useProfile] Fetching profile...')

    const targetUserId = userId || authStore.user?.id

    if (!targetUserId) {
      console.error('[useProfile] ❌ No user ID provided')
      error.value = 'No user ID provided'
      return
    }

    console.log('[useProfile] Target user ID:', targetUserId)

    loading.value = true
    error.value = null

    try {
      console.log('[useProfile] Calling profile store fetchProfile...')
      await profileStore.fetchProfile(targetUserId)
      console.log('[useProfile] ✅ Profile fetched successfully')
      console.log('[useProfile] ============ FETCH PROFILE END ============')
    } catch (err: any) {
      console.error('[useProfile] ❌ Fetch error:', err.message)
      error.value = err.message || 'Failed to fetch profile'
      console.log('[useProfile] ============ FETCH PROFILE END ============')
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // FETCH CURRENT USER PROFILE METHOD
  // ============================================================================
  const fetchCurrentUserProfile = async () => {
    console.log('[useProfile] ============ FETCH CURRENT USER PROFILE START ============')

    if (!authStore.isAuthenticated) {
      console.error('[useProfile] ❌ User not authenticated')
      error.value = 'User not authenticated'
      return
    }

    if (!authStore.user?.id) {
      console.error('[useProfile] ❌ No user ID in auth store')
      error.value = 'No user ID found'
      return
    }

    console.log('[useProfile] Current user ID:', authStore.user.id)
    await fetchProfile(authStore.user.id)
    console.log('[useProfile] ============ FETCH CURRENT USER PROFILE END ============')
  }

  // ============================================================================
  // UPDATE PROFILE METHOD
  // ============================================================================
  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('[useProfile] ============ UPDATE PROFILE START ============')
    console.log('[useProfile] Updating profile with:', {
      full_name: updates.full_name,
      bio: updates.bio,
      location: updates.location
    })

    if (!profile.value) {
      console.error('[useProfile] ❌ No profile loaded')
      error.value = 'No profile loaded'
      return
    }

    loading.value = true
    error.value = null

    try {
      console.log('[useProfile] Calling profile store updateProfile...')
      await profileStore.updateProfile(updates)
      console.log('[useProfile] ✅ Profile updated successfully')
      console.log('[useProfile] ============ UPDATE PROFILE END ============')
    } catch (err: any) {
      console.error('[useProfile] ❌ Update error:', err.message)
      error.value = err.message || 'Failed to update profile'
      console.log('[useProfile] ============ UPDATE PROFILE END ============')
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // UPDATE PROFILE FIELD METHOD
  // ============================================================================
  const updateProfileField = async (field: keyof Profile, value: any) => {
    console.log('[useProfile] ============ UPDATE PROFILE FIELD START ============')
    console.log('[useProfile] Updating field:', field, 'with value:', value)

    if (!profile.value) {
      console.error('[useProfile] ❌ No profile loaded')
      error.value = 'No profile loaded'
      return
    }

    const updates: Partial<Profile> = {
      [field]: value
    }

    console.log('[useProfile] Calling updateProfile with:', updates)
    await updateProfile(updates)
    console.log('[useProfile] ============ UPDATE PROFILE FIELD END ============')
  }

  // ============================================================================
  // UPDATE AVATAR METHOD
  // ============================================================================
  const updateAvatar = async (avatarUrl: string) => {
    console.log('[useProfile] ============ UPDATE AVATAR START ============')
    console.log('[useProfile] Updating avatar URL...')

    await updateProfileField('avatar_url', avatarUrl)
    console.log('[useProfile] ============ UPDATE AVATAR END ============')
  }

  // ============================================================================
  // UPDATE BIO METHOD
  // ============================================================================
  const updateBio = async (newBio: string) => {
    console.log('[useProfile] ============ UPDATE BIO START ============')
    console.log('[useProfile] Updating bio...')

    await updateProfileField('bio', newBio)
    console.log('[useProfile] ============ UPDATE BIO END ============')
  }

  // ============================================================================
  // UPDATE LOCATION METHOD
  // ============================================================================
  const updateLocation = async (newLocation: string) => {
    console.log('[useProfile] ============ UPDATE LOCATION START ============')
    console.log('[useProfile] Updating location...')

    await updateProfileField('location', newLocation)
    console.log('[useProfile] ============ UPDATE LOCATION END ============')
  }

  // ============================================================================
  // UPDATE FULL NAME METHOD
  // ============================================================================
  const updateFullName = async (newFullName: string) => {
    console.log('[useProfile] ============ UPDATE FULL NAME START ============')
    console.log('[useProfile] Updating full name...')

    await updateProfileField('full_name', newFullName)
    console.log('[useProfile] ============ UPDATE FULL NAME END ============')
  }

  // ============================================================================
  // CLEAR PROFILE METHOD
  // ============================================================================
  const clearProfile = () => {
    console.log('[useProfile] ============ CLEAR PROFILE START ============')
    console.log('[useProfile] Clearing profile...')

    profileStore.clearProfile()
    error.value = null
    loading.value = false

    console.log('[useProfile] ✅ Profile cleared')
    console.log('[useProfile] ============ CLEAR PROFILE END ============')
  }

  // ============================================================================
  // CLEAR ERROR METHOD
  // ============================================================================
  const clearError = () => {
    console.log('[useProfile] Clearing error...')
    error.value = null
  }

  // ============================================================================
  // REFRESH PROFILE METHOD
  // ============================================================================
  const refreshProfile = async () => {
    console.log('[useProfile] ============ REFRESH PROFILE START ============')
    console.log('[useProfile] Refreshing profile...')

    await fetchCurrentUserProfile()
    console.log('[useProfile] ✅ Profile refreshed')
    console.log('[useProfile] ============ REFRESH PROFILE END ============')
  }

  // ============================================================================
  // GET PROFILE BY USERNAME METHOD
  // ============================================================================
  const getProfileByUsername = async (username: string) => {
    console.log('[useProfile] ============ GET PROFILE BY USERNAME START ============')
    console.log('[useProfile] Fetching profile for username:', username)

    if (!username) {
      console.error('[useProfile] ❌ No username provided')
      error.value = 'No username provided'
      return null
    }

    loading.value = true
    error.value = null

    try {
      console.log('[useProfile] Calling API to fetch profile by username...')

      const response = await $fetch('/api/profile/by-username', {
        method: 'GET',
        query: { username }
      })

      console.log('[useProfile] ✅ Profile fetched by username:', {
        id: response?.id,
        username: response?.username
      })

      console.log('[useProfile] ============ GET PROFILE BY USERNAME END ============')
      return response

    } catch (err: any) {
      console.error('[useProfile] ❌ Error:', err.message)
      error.value = err.message || 'Failed to fetch profile'
      console.log('[useProfile] ============ GET PROFILE BY USERNAME END ============')
      return null

    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // CHECK IF PROFILE IS CURRENT USER METHOD
  // ============================================================================
  const isCurrentUserProfile = computed(() => {
    if (!profile.value || !authStore.user) {
      return false
    }
    return profile.value.id === authStore.user.id
  })

  // ============================================================================
  // GET PROFILE COMPLETION PERCENTAGE METHOD
  // ============================================================================
  const getProfileCompletionPercentage = computed(() => {
    if (!profile.value) return 0

    let completedFields = 0
    const totalFields = 6

    if (profile.value.username) completedFields++
    if (profile.value.full_name) completedFields++
    if (profile.value.email) completedFields++
    if (profile.value.avatar_url) completedFields++
    if (profile.value.bio) completedFields++
    if (profile.value.location) completedFields++

    return Math.round((completedFields / totalFields) * 100)
  })

  // ============================================================================
  // RETURN COMPOSABLE
  // ============================================================================
  return {
    // State
    profile,
    loading: isLoading,
    error: isError,

    // Computed Properties
    username,
    displayName,
    avatar,
    email,
    bio,
    location,
    website,
    followers,
    following,
    posts,
    verified,
    isProfileComplete,
    hasAvatar,
    isCurrentUserProfile,
    getProfileCompletionPercentage,

    // Methods
    fetchProfile,
    fetchCurrentUserProfile,
    updateProfile,
    updateProfileField,
    updateAvatar,
    updateBio,
    updateLocation,
    updateFullName,
    clearProfile,
    clearError,
    refreshProfile,
    getProfileByUsername
  }
}
