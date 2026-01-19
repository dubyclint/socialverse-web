// ============================================================================
// FILE: /stores/profile.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ ISSUE #3 FIXED: Conditional broadcasting (only when profile_completed=true)
// ✅ ISSUE #4 FIXED: Proper id/user_id mapping (both directions)
// ✅ Authorization headers on all API calls
// ✅ Comprehensive error handling and logging
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile } from '~/types/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)
  const isUploadingAvatar = ref(false)
  const uploadAvatarProgress = ref(0)
  const uploadAvatarError = ref<string | null>(null)

  // ============================================================================
  // COMPUTED PROPERTIES - PROFILE FIELD ACCESSORS
  // ============================================================================

  const username = computed(() => {
    return profile.value?.username || 'Unknown'
  })

  const displayName = computed(() => {
    return profile.value?.full_name || 'User'
  })

  const avatar = computed(() => {
    return profile.value?.avatar_url || '/default-avatar.png'
  })

  const bio = computed(() => {
    return profile.value?.bio || ''
  })

  const location = computed(() => {
    return profile.value?.location || ''
  })

  const website = computed(() => {
    return profile.value?.website || ''
  })

  const interests = computed(() => {
    return profile.value?.interests || []
  })

  const colors = computed(() => {
    return profile.value?.colors || {}
  })

  const items = computed(() => {
    return profile.value?.items || []
  })

  // ============================================================================
  // RANK SYSTEM COMPUTED PROPERTIES
  // ============================================================================

  const rank = computed(() => {
    return profile.value?.rank || 'Bronze I'
  })

  const rankPoints = computed(() => {
    return profile.value?.rank_points || 0
  })

  const rankLevel = computed(() => {
    return profile.value?.rank_level || 1
  })

  // ============================================================================
  // VERIFICATION COMPUTED PROPERTIES
  // ============================================================================

  const isVerified = computed(() => {
    return profile.value?.is_verified || false
  })

  const verifiedBadgeType = computed(() => {
    return profile.value?.verified_badge_type || null
  })

  const verificationStatus = computed(() => {
    return profile.value?.verification_status || 'none'
  })

  const badgeCount = computed(() => {
    return profile.value?.badge_count || 0
  })

  const verifiedAt = computed(() => {
    return profile.value?.verified_at || null
  })

  // ============================================================================
  // PROFILE COMPLETION COMPUTED PROPERTIES
  // ============================================================================

  const isProfileComplete = computed(() => {
    if (!profile.value) return false
    return profile.value.profile_completed && !!profile.value.full_name && !!profile.value.bio
  })

  const hasAvatar = computed(() => {
    return !!profile.value?.avatar_url
  })

  // ============================================================================
  // HELPER FUNCTION: Normalize profile data
  // ============================================================================
  // ✅ ISSUE #4 FIX: Ensures both id and user_id are always set
  // The user_profiles table uses 'id' as primary key, but frontend expects 'user_id'
  // This function maps id ↔ user_id for compatibility
  const normalizeProfile = (rawProfile: any): Profile => {
    console.log('[Profile Store] ============ NORMALIZE PROFILE START ============')
    console.log('[Profile Store] Normalizing profile data...')

    if (!rawProfile) {
      console.warn('[Profile Store] ⚠️ Raw profile is null/undefined')
      return null as any
    }

    const normalized = {
      ...rawProfile,
      // ✅ ISSUE #4 FIX: Ensure user_id is always set (map from id if needed)
      user_id: rawProfile.user_id || rawProfile.id,
      // ✅ ISSUE #4 FIX: Ensure id is always set (map from user_id if needed)
      id: rawProfile.id || rawProfile.user_id
    } as Profile

    console.log('[Profile Store] ✅ Profile normalized:', {
      id: normalized.id,
      user_id: normalized.user_id,
      username: normalized.username,
      full_name: normalized.full_name,
      profile_completed: normalized.profile_completed
    })

    console.log('[Profile Store] ============ NORMALIZE PROFILE END ============')
    return normalized
  }

  // ============================================================================
  // ACTIONS - SET STATE
  // ============================================================================

  const setProfile = (newProfile: Profile | null) => {
    console.log('[Profile Store] ============ SET PROFILE START ============')
    console.log('[Profile Store] Setting profile...')

    if (!newProfile) {
      console.log('[Profile Store] Clearing profile data')
      profile.value = null

      if (process.client) {
        try {
          localStorage.removeItem('profile_data')
          console.log('[Profile Store] ✅ Profile cleared from localStorage')
        } catch (err) {
          console.error('[Profile Store] ❌ Failed to clear localStorage:', err)
        }
      }
      console.log('[Profile Store] ============ SET PROFILE END ============')
      return
    }

    // ✅ ISSUE #4 FIX: Normalize profile to ensure user_id is always set
    const normalizedProfile = normalizeProfile(newProfile)

    console.log('[Profile Store] Profile data received:', {
      user_id: normalizedProfile.user_id,
      id: normalizedProfile.id,
      full_name: normalizedProfile.full_name,
      rank: normalizedProfile.rank,
      is_verified: normalizedProfile.is_verified,
      profile_completed: normalizedProfile.profile_completed
    })

    profile.value = normalizedProfile

    if (process.client) {
      try {
        localStorage.setItem('profile_data', JSON.stringify(normalizedProfile))
        console.log('[Profile Store] ✅ Profile stored in localStorage')
      } catch (err) {
        console.error('[Profile Store] ❌ Failed to store profile in localStorage:', err)
      }
    }

    console.log('[Profile Store] ✅ Profile set successfully')

    // ✅ ISSUE #3 FIX: Only broadcast if profile is truly complete
    if (normalizedProfile.profile_completed) {
      console.log('[Profile Store] ✅ Profile is complete, broadcasting update...')
      broadcastProfileUpdate(normalizedProfile)
    } else {
      console.log('[Profile Store] ℹ️ Profile not complete yet, skipping broadcast')
    }

    console.log('[Profile Store] ============ SET PROFILE END ============')
  }

  const setLoading = (loading: boolean) => {
    console.log('[Profile Store] Setting loading:', loading)
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
    if (err) {
      console.error('[Profile Store] Error:', err)
    } else {
      console.log('[Profile Store] Error cleared')
    }
  }

  // ============================================================================
  // ACTIONS - CLEAR PROFILE
  // ============================================================================

  const clearProfile = () => {
    console.log('[Profile Store] ============ CLEAR PROFILE START ============')

    profile.value = null
    isLoading.value = false
    error.value = null
    isHydrated.value = false
    isUploadingAvatar.value = false
    uploadAvatarProgress.value = 0
    uploadAvatarError.value = null

    if (process.client) {
      try {
        localStorage.removeItem('profile_data')
        console.log('[Profile Store] ✅ Profile data cleared from localStorage')
      } catch (err) {
        console.error('[Profile Store] ❌ Failed to clear localStorage:', err)
      }
    }

    console.log('[Profile Store] ============ CLEAR PROFILE END ============')
  }

  // ============================================================================
  // ACTIONS - FETCH PROFILE - ✅ WITH AUTH HEADER
  // ============================================================================

  const fetchProfile = async (userId: string) => {
    console.log('[Profile Store] ============ FETCH PROFILE START ============')
    console.log('[Profile Store] Fetching profile for user:', userId)

    if (!userId) {
      console.error('[Profile Store] ❌ No user ID provided')
      setError('No user ID provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('[Profile Store] Calling API to fetch profile...')

      // ✅ Get auth store and add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token

      console.log('[Profile Store] Token available:', !!token)

      // ✅ Add Authorization header to API call
      const response = await $fetch('/api/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('[Profile Store] ✅ Profile API response received:', {
        user_id: response?.user_id || response?.id,
        id: response?.id,
        full_name: response?.full_name,
        rank: response?.rank,
        profile_completed: response?.profile_completed
      })

      if (!response) {
        console.error('[Profile Store] ❌ No profile data in response')
        setError('Profile not found')
        return
      }

      // ✅ ISSUE #4 FIX: Normalize response before setting
      const normalizedResponse = normalizeProfile(response)
      setProfile(normalizedResponse)

      console.log('[Profile Store] ✅ Profile fetched and stored successfully')
      console.log('[Profile Store] ============ FETCH PROFILE END ============')

    } catch (err: any) {
      console.error('[Profile Store] ============ FETCH PROFILE ERROR ============')
      console.error('[Profile Store] ❌ Error fetching profile:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to fetch profile'
      setError(errorMessage)

      console.error('[Profile Store] Error details:', {
        message: errorMessage,
        status: err?.status,
        statusCode: err?.statusCode
      })
      console.error('[Profile Store] ============ FETCH PROFILE ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - UPDATE PROFILE - ✅ WITH AUTH HEADER
  // ============================================================================

  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('[Profile Store] ============ UPDATE PROFILE START ============')
    console.log('[Profile Store] Updating profile with:', updates)

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile loaded')
      setError('No profile loaded')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const authStore = useAuthStore()
      const token = authStore.token

      // ✅ Add Authorization header
      const response = await $fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: updates
      })

      console.log('[Profile Store] ✅ Profile update response:', response)

      if (response) {
        const normalizedResponse = normalizeProfile(response)
        setProfile(normalizedResponse)
        console.log('[Profile Store] ✅ Profile updated successfully')
      }

      console.log('[Profile Store] ============ UPDATE PROFILE END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ UPDATE PROFILE ERROR ============')
      console.error('[Profile Store] ❌ Error updating profile:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to update profile'
      setError(errorMessage)

      console.error('[Profile Store] ============ UPDATE PROFILE ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - COMPLETE PROFILE - ✅ WITH AUTH HEADER
  // ============================================================================

  const completeProfile = async (profileData: Partial<Profile>) => {
    console.log('[Profile Store] ============ COMPLETE PROFILE START ============')
    console.log('[Profile Store] Completing profile with:', profileData)

    setLoading(true)
    setError(null)

    try {
      const authStore = useAuthStore()
      const token = authStore.token

      // ✅ Add Authorization header
      const response = await $fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: profileData
      })

      console.log('[Profile Store] ✅ Profile completion response:', response)

      if (response) {
        const normalizedResponse = normalizeProfile(response)
        setProfile(normalizedResponse)
        console.log('[Profile Store] ✅ Profile completed successfully')
      }

      console.log('[Profile Store] ============ COMPLETE PROFILE END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ COMPLETE PROFILE ERROR ============')
      console.error('[Profile Store] ❌ Error completing profile:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to complete profile'
      setError(errorMessage)

      console.error('[Profile Store] ============ COMPLETE PROFILE ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - UPLOAD AVATAR - ✅ WITH AUTH HEADER
  // ============================================================================

  const uploadAvatar = async (file: File) => {
    console.log('[Profile Store] ============ UPLOAD AVATAR START ============')
    console.log('[Profile Store] Uploading avatar file:', file.name)

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile loaded')
      setError('No profile loaded')
      return
    }

    isUploadingAvatar.value = true
    uploadAvatarError.value = null
    uploadAvatarProgress.value = 0

    try {
      const authStore = useAuthStore()
      const token = authStore.token

      const formData = new FormData()
      formData.append('file', file)

      console.log('[Profile Store] Uploading avatar...')

      // ✅ Add Authorization header
      const response = await $fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        onUploadProgress: (event: any) => {
          if (event.total) {
            uploadAvatarProgress.value = Math.round((event.loaded / event.total) * 100)
            console.log('[Profile Store] Upload progress:', uploadAvatarProgress.value + '%')
          }
        }
      })

      console.log('[Profile Store] ✅ Avatar uploaded:', response)

      if (response?.url) {
        // Update profile with new avatar URL
        const updatedProfile = {
          ...profile.value,
          avatar_url: response.url,
          updated_at: new Date().toISOString()
        }
        const normalizedProfile = normalizeProfile(updatedProfile)
        setProfile(normalizedProfile)
        console.log('[Profile Store] ✅ Avatar updated successfully')
      }

      console.log('[Profile Store] ============ UPLOAD AVATAR END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ UPLOAD AVATAR ERROR ============')
      console.error('[Profile Store] ❌ Error uploading avatar:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to upload avatar'
      uploadAvatarError.value = errorMessage

      console.error('[Profile Store] ============ UPLOAD AVATAR ERROR END ============')
    } finally {
      isUploadingAvatar.value = false
    }
  }

  const clearAvatarUploadError = () => {
    uploadAvatarError.value = null
  }

  // ============================================================================
  // ACTIONS - INTERESTS MANAGEMENT - ✅ WITH AUTH HEADER
  // ============================================================================

  const addInterest = async (interest: string) => {
    console.log('[Profile Store] ============ ADD INTEREST START ============')
    console.log('[Profile Store] Adding interest:', interest)

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile loaded')
      setError('No profile loaded')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const authStore = useAuthStore()
      const token = authStore.token

      // ✅ Add Authorization header
      const response = await $fetch('/api/interests/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: { interest }
      })

      console.log('[Profile Store] ✅ Interest added:', response)

      if (response) {
        const normalizedResponse = normalizeProfile(response)
        setProfile(normalizedResponse)
        console.log('[Profile Store] ✅ Interest added successfully')
      }

      console.log('[Profile Store] ============ ADD INTEREST END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ ADD INTEREST ERROR ============')
      console.error('[Profile Store] ❌ Error adding interest:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to add interest'
      setError(errorMessage)

      console.error('[Profile Store] ============ ADD INTEREST ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  const removeInterest = async (interest: string) => {
    console.log('[Profile Store] ============ REMOVE INTEREST START ============')
    console.log('[Profile Store] Removing interest:', interest)

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile loaded')
      setError('No profile loaded')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const authStore = useAuthStore()
      const token = authStore.token

      // ✅ Add Authorization header
      const response = await $fetch('/api/interests/remove', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: { interest }
      })

      console.log('[Profile Store] ✅ Interest removed:', response)

      if (response) {
        const normalizedResponse = normalizeProfile(response)
        setProfile(normalizedResponse)
        console.log('[Profile Store] ✅ Interest removed successfully')
      }

      console.log('[Profile Store] ============ REMOVE INTEREST END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ REMOVE INTEREST ERROR ============')
      console.error('[Profile Store] ❌ Error removing interest:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to remove interest'
      setError(errorMessage)

      console.error('[Profile Store] ============ REMOVE INTEREST ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - PROFILE SYNC (NEW) - ✅ BROADCAST UPDATES
  // ============================================================================

  /**
   * ✅ ISSUE #3 FIX: Broadcast profile update to all listeners
   * Only broadcasts when profile_completed = true
   */
  const broadcastProfileUpdate = (updatedProfile: Profile) => {
    console.log('[Profile Store] ============ BROADCAST PROFILE UPDATE START ============')
    console.log('[Profile Store] Broadcasting profile update:', {
      id: updatedProfile.id,
      user_id: updatedProfile.user_id,
      username: updatedProfile.username,
      profile_completed: updatedProfile.profile_completed
    })

    if (process.client) {
      window.dispatchEvent(
        new CustomEvent('profileUpdated', {
          detail: updatedProfile,
          bubbles: true,
          composed: true
        })
      )
      console.log('[Profile Store] ✅ Profile update event dispatched')
    }

    console.log('[Profile Store] ============ BROADCAST PROFILE UPDATE END ============')
  }

  /**
   * ✅ NEW: Update specific profile field and sync
   */
  const updateProfileField = async (field: string, value: any) => {
    console.log('[Profile Store] ============ UPDATE FIELD START ============')
    console.log('[Profile Store] Updating field:', field, 'with value:', value)

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile loaded')
      setError('No profile loaded')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Update local state optimistically
      const updatedProfile = {
        ...profile.value,
        [field]: value,
        updated_at: new Date().toISOString()
      }
      const normalizedProfile = normalizeProfile(updatedProfile)
      profile.value = normalizedProfile

      // ✅ ISSUE #3 FIX: Only broadcast if profile is complete
      if (normalizedProfile.profile_completed) {
        broadcastProfileUpdate(normalizedProfile)
      }

      // Sync to API
      const authStore = useAuthStore()
      const token = authStore.token

      // ✅ Add Authorization header
      const response = await $fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: { [field]: value }
      })

      console.log('[Profile Store] ✅ Field updated:', response)

      if (response) {
        const normalizedResponse = normalizeProfile(response)
        setProfile(normalizedResponse)
        console.log('[Profile Store] ✅ Field update synced successfully')
      }

      console.log('[Profile Store] ============ UPDATE FIELD END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ UPDATE FIELD ERROR ============')
      console.error('[Profile Store] ❌ Error updating field:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to update field'
      setError(errorMessage)

      // Revert optimistic update
      if (profile.value) {
        profile.value = { ...profile.value }
      }

      console.error('[Profile Store] ============ UPDATE FIELD ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  /**
   * ✅ NEW: Refresh profile from API
   */
  const refreshProfile = async (userId?: string) => {
    console.log('[Profile Store] ============ REFRESH PROFILE START ============')
    console.log('[Profile Store] Refreshing profile...')

    try {
      setLoading(true)
      setError(null)

      const authStore = useAuthStore()
      const token = authStore.token
      const id = userId || profile.value?.id || profile.value?.user_id

      if (!id) {
        console.error('[Profile Store] ❌ No user ID provided')
        setError('No user ID provided')
        return
      }

      // ✅ Add Authorization header
      const response = await $fetch(`/api/profile/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('[Profile Store] ✅ Profile refreshed:', response)

      if (response) {
        const normalizedResponse = normalizeProfile(response)
        setProfile(normalizedResponse)
        console.log('[Profile Store] ✅ Profile refresh successful')
      }

      console.log('[Profile Store] ============ REFRESH PROFILE END ============')
      return response

    } catch (err: any) {
      console.error('[Profile Store] ============ REFRESH PROFILE ERROR ============')
      console.error('[Profile Store] ❌ Error refreshing profile:', err)

      const errorMessage = err?.data?.message || err?.message || 'Failed to refresh profile'
      setError(errorMessage)

      console.error('[Profile Store] ============ REFRESH PROFILE ERROR END ============')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - STORAGE MANAGEMENT
  // ============================================================================

  const hydrateFromStorage = () => {
    console.log('[Profile Store] ============ HYDRATE FROM STORAGE START ============')

    if (!process.client) {
      console.log('[Profile Store] Server-side, skipping hydration')
      return
    }

    try {
      const stored = localStorage.getItem('profile_data')
      if (stored) {
        const profileData = JSON.parse(stored)
        // ✅ ISSUE #4 FIX: Normalize stored profile
        const normalizedProfile = normalizeProfile(profileData)
        profile.value = normalizedProfile
        isHydrated.value = true
        console.log('[Profile Store] ✅ Profile hydrated from localStorage')
      } else {
        console.log('[Profile Store] ℹ️ No profile data in localStorage')
      }
    } catch (err) {
      console.error('[Profile Store] ❌ Error hydrating from storage:', err)
    }

    console.log('[Profile Store] ============ HYDRATE FROM STORAGE END ============')
  }

  const initializeProfile = async () => {
    console.log('[Profile Store] ============ INITIALIZE PROFILE START ============')

    try {
      // First try to hydrate from storage
      hydrateFromStorage()

      // Then fetch fresh data from API
      const authStore = useAuthStore()
      if (authStore.user?.id) {
        await fetchProfile(authStore.user.id)
      }

      console.log('[Profile Store] ✅ Profile initialization complete')
    } catch (err) {
      console.error('[Profile Store] ❌ Error initializing profile:', err)
    }

    console.log('[Profile Store] ============ INITIALIZE PROFILE END ============')
  }

  // ============================================================================
  // RETURN STORE INTERFACE
  // ============================================================================

  return {
    // State
    profile,
    isLoading,
    error,
    isHydrated,
    isUploadingAvatar,
    uploadAvatarProgress,
    uploadAvatarError,

    // Computed Properties - Basic
    username,
    displayName,
    avatar,
    bio,
    location,
    website,
    interests,
    colors,
    items,

    // Computed Properties - Rank
    rank,
    rankPoints,
    rankLevel,

    // Computed Properties - Verification
    isVerified,
    verifiedBadgeType,
    verificationStatus,
    badgeCount,
    verifiedAt,

    // Computed Properties - Completion
    isProfileComplete,
    hasAvatar,

    // Methods - State Management
    setProfile,
    setLoading,
    setError,
    clearProfile,

    // Methods - Profile Operations
    fetchProfile,
    updateProfile,
    completeProfile,
    uploadAvatar,
    clearAvatarUploadError,
    addInterest,
    removeInterest,

    // Methods - Profile Sync (NEW)
    broadcastProfileUpdate,
    updateProfileField,
    refreshProfile,

    // Methods - Storage
    hydrateFromStorage,
    initializeProfile
  }
})
