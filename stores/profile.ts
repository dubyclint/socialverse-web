// ============================================================================
// FILE: /stores/profile.ts - COMPLETE FIXED VERSION
// ============================================================================
// Profile store with rank & verification integration
// ✅ FIXED: All API calls now include Authorization header
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
    return profile.value?.full_name || 'Unknown'
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
  // ACTIONS - SET STATE
  // ============================================================================
  
  const setProfile = (newProfile: Profile | null) => {
    console.log('[Profile Store] Setting profile...')
    
    if (!newProfile) {
      console.log('[Profile Store] Clearing profile data')
      profile.value = null
      
      if (process.client) {
        localStorage.removeItem('profile_data')
        console.log('[Profile Store] ✅ Profile cleared from localStorage')
      }
      return
    }

    console.log('[Profile Store] Profile data received:', {
      user_id: newProfile.user_id,
      full_name: newProfile.full_name,
      rank: newProfile.rank,
      is_verified: newProfile.is_verified
    })

    profile.value = newProfile

    if (process.client) {
      try {
        localStorage.setItem('profile_data', JSON.stringify(newProfile))
        console.log('[Profile Store] ✅ Profile stored in localStorage')
      } catch (err) {
        console.error('[Profile Store] ❌ Failed to store profile in localStorage:', err)
      }
    }

    console.log('[Profile Store] ✅ Profile set successfully')
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

  const clearProfile = () => {
    console.log('[Profile Store] ============ CLEAR PROFILE START ============')
    console.log('[Profile Store] Clearing all profile data')
    
    profile.value = null
    error.value = null
    isLoading.value = false
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
  // ACTIONS - FETCH PROFILE - FIXED WITH AUTH HEADER
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
      
      // ✅ FIX: Get auth store and add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token
      
      console.log('[Profile Store] Token available:', !!token)

      const response = await $fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('[Profile Store] ✅ Profile API response received:', {
        user_id: response?.user_id || response?.id,
        full_name: response?.full_name,
        rank: response?.rank
      })

      if (!response) {
        console.error('[Profile Store] ❌ No profile data in response')
        setError('Profile not found')
        return
      }

      setProfile(response)
      console.log('[Profile Store] ✅ Profile fetched and stored successfully')
      console.log('[Profile Store] ============ FETCH PROFILE END ============')

    } catch (err: any) {
      console.error('[Profile Store] ============ FETCH PROFILE ERROR ============')
      console.error('[Profile Store] Error:', err.message)

      let errorMessage = 'Failed to fetch profile'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      }

      console.error('[Profile Store] ============ END ERROR ============')
      setError(errorMessage)

    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - UPDATE PROFILE - FIXED WITH AUTH HEADER
  // ============================================================================
  
  const updateProfile = async (updates: Partial<Profile>) => {
    console.log('[Profile Store] ============ UPDATE PROFILE START ============')
    console.log('[Profile Store] Updating profile with:', {
      full_name: updates.full_name,
      bio: updates.bio,
      location: updates.location
    })

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile to update')
      setError('No profile loaded')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('[Profile Store] Calling API to update profile...')

      // ✅ FIX: Add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token

      console.log('[Profile Store] Token available:', !!token)

      const response = await $fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: updates
      })

      console.log('[Profile Store] ✅ Profile update API response received')

      if (!response) {
        console.error('[Profile Store] ❌ No profile data in response')
        setError('Profile update failed')
        return
      }

      const updatedProfile = {
        ...profile.value,
        ...response,
        updated_at: new Date().toISOString()
      }

      setProfile(updatedProfile)
      console.log('[Profile Store] ✅ Profile updated successfully')
      console.log('[Profile Store] ============ UPDATE PROFILE END ============')

    } catch (err: any) {
      console.error('[Profile Store] ============ UPDATE PROFILE ERROR ============')
      console.error('[Profile Store] Error:', err.message)

      let errorMessage = 'Failed to update profile'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      }

      console.error('[Profile Store] ============ END ERROR ============')
      setError(errorMessage)

    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - COMPLETE PROFILE - FIXED WITH AUTH HEADER
  // ============================================================================
  
  const completeProfile = async (data: any) => {
    console.log('[Profile Store] ============ COMPLETE PROFILE START ============')
    console.log('[Profile Store] Completing profile with:', {
      full_name: data.full_name,
      bio: data.bio
    })

    setLoading(true)
    setError(null)

    try {
      console.log('[Profile Store] Calling API to complete profile...')

      // ✅ FIX: Add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token

      console.log('[Profile Store] Token available:', !!token)

      const response = await $fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      })

      console.log('[Profile Store] ✅ Profile completion API response received')

      if (!response) {
        console.error('[Profile Store] ❌ No profile data in response')
        setError('Profile completion failed')
        return
      }

      setProfile(response)
      console.log('[Profile Store] ✅ Profile completed successfully')
      console.log('[Profile Store] ============ COMPLETE PROFILE END ============')

    } catch (err: any) {
      console.error('[Profile Store] ============ COMPLETE PROFILE ERROR ============')
      console.error('[Profile Store] Error:', err.message)

      let errorMessage = 'Failed to complete profile'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      }

      console.error('[Profile Store] ============ END ERROR ============')
      setError(errorMessage)

    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // ACTIONS - UPLOAD AVATAR - FIXED WITH AUTH HEADER
  // ============================================================================
  
  const uploadAvatar = async (file: File): Promise<string | null> => {
    console.log('[Profile Store] ============ UPLOAD AVATAR START ============')
    console.log('[Profile Store] Uploading avatar:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    if (!profile.value) {
      console.error('[Profile Store] ❌ No profile to update avatar')
      uploadAvatarError.value = 'No profile loaded'
      return null
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024

    if (!allowedTypes.includes(file.type || '')) {
      console.error('[Profile Store] ❌ Invalid file type:', file.type)
      uploadAvatarError.value = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      return null
    }

    if (file.size > maxSize) {
      console.error('[Profile Store] ❌ File size exceeds limit:', file.size)
      uploadAvatarError.value = 'File size exceeds 5MB limit.'
      return null
    }

    isUploadingAvatar.value = true
    uploadAvatarProgress.value = 0
    uploadAvatarError.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('[Profile Store] FormData created, starting upload...')

      const progressInterval = setInterval(() => {
        if (uploadAvatarProgress.value < 90) {
          uploadAvatarProgress.value += Math.random() * 30
        }
      }, 200)

      console.log('[Profile Store] Sending upload request to /api/profile/avatar-upload')

      // ✅ FIX: Add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token

      const response = await fetch('/api/profile/avatar-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      clearInterval(progressInterval)
      uploadAvatarProgress.value = 100

      console.log('[Profile Store] Upload response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[Profile Store] ✅ Upload successful:', data)

      if (!data.success || !data.url) {
        throw new Error('Invalid upload response')
      }

      const updatedProfile = {
        ...profile.value,
        avatar_url: data.url,
        updated_at: new Date().toISOString()
      }

      setProfile(updatedProfile)

      console.log('[Profile Store] ✅ Avatar updated in profile store')
      console.log('[Profile Store] ============ UPLOAD AVATAR END ============')

      return data.url

    } catch (error: any) {
      console.error('[Profile Store] ============ UPLOAD AVATAR ERROR ============')
      console.error('[Profile Store] Error:', error.message)

      uploadAvatarError.value = error.message || 'Failed to upload avatar'
      console.error('[Profile Store] ============ END ERROR ============')

      return null

    } finally {
      isUploadingAvatar.value = false
    }
  }

  const clearAvatarUploadError = () => {
    console.log('[Profile Store] Clearing avatar upload error')
    uploadAvatarError.value = null
  }

  // ============================================================================
  // ACTIONS - INTERESTS - FIXED WITH AUTH HEADER
  // ============================================================================
  
  const addInterest = async (interestId: string) => {
    console.log('[Profile Store] Adding interest:', interestId)

    try {
      // ✅ FIX: Add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token

      await $fetch('/api/interests/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: { interestId }
      })
      
      console.log('[Profile Store] ✅ Interest added, refetching profile...')
      await fetchProfile(profile.value?.user_id || '')
    } catch (error: any) {
      console.error('[Profile Store] ❌ Failed to add interest:', error.message)
      setError(error.message)
    }
  }

  const removeInterest = async (interestId: string) => {
    console.log('[Profile Store] Removing interest:', interestId)

    try {
      // ✅ FIX: Add Authorization header
      const authStore = useAuthStore()
      const token = authStore.token

      await $fetch('/api/interests/remove', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: { interestId }
      })
      
      console.log('[Profile Store] ✅ Interest removed, refetching profile...')
      await fetchProfile(profile.value?.user_id || '')
    } catch (error: any) {
      console.error('[Profile Store] ❌ Failed to remove interest:', error.message)
      setError(error.message)
    }
  }

  // ============================================================================
  // ACTIONS - HYDRATION
  // ============================================================================
  
  const hydrateFromStorage = async () => {
    console.log('[Profile Store] ============ HYDRATE FROM STORAGE START ============')

    if (!process.client || isHydrated.value) {
      console.log('[Profile Store] Hydration skipped (not client or already hydrated)')
      console.log('[Profile Store] ============ HYDRATE FROM STORAGE END ============')
      return
    }

    console.log('[Profile Store] Hydrating from localStorage...')

    try {
      const storedProfile = localStorage.getItem('profile_data')

      if (storedProfile) {
        try {
          const parsedProfile = JSON.parse(storedProfile)
          profile.value = parsedProfile
          console.log('[Profile Store] ✅ Profile restored from localStorage:', {
            user_id: parsedProfile.user_id,
            full_name: parsedProfile.full_name
          })
        } catch (parseError) {
          console.error('[Profile Store] ❌ Failed to parse stored profile:', parseError)
          localStorage.removeItem('profile_data')
        }
      } else {
        console.log('[Profile Store] No profile data in localStorage')
      }

      isHydrated.value = true
      console.log('[Profile Store] ✅ Hydration complete')
      console.log('[Profile Store] ============ HYDRATE FROM STORAGE END ============')

    } catch (err) {
      console.error('[Profile Store] ❌ Hydration error:', err)
      isHydrated.value = true
      console.log('[Profile Store] ============ HYDRATE FROM STORAGE END ============')
    }
  }

  const initializeProfile = async (userId: string) => {
    console.log('[Profile Store] ============ INITIALIZE PROFILE START ============')
    console.log('[Profile Store] Initializing profile for user:', userId)

    try {
      await fetchProfile(userId)

      if (!profile.value) {
        console.log('[Profile Store] Profile fetch failed, trying hydration from storage...')
        await hydrateFromStorage()
      }

      console.log('[Profile Store] ✅ Profile initialization complete')
      console.log('[Profile Store] ============ INITIALIZE PROFILE END ============')

    } catch (err) {
      console.error('[Profile Store] ❌ Initialization error:', err)
      console.log('[Profile Store] ============ INITIALIZE PROFILE END ============')
    }
  }

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

    // Methods
    setProfile,
    setLoading,
    setError,
    clearProfile,
    fetchProfile,
    updateProfile,
    completeProfile,
    uploadAvatar,
    clearAvatarUploadError,
    addInterest,
    removeInterest,
    hydrateFromStorage,
    initializeProfile
  }
})
