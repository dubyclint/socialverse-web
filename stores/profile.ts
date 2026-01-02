// ============================================================================
// FILE 2: /stores/profile.ts - ENHANCED VERSION WITH AVATAR UPLOAD
// PHASE 3: Add upload avatar action
// ============================================================================
// ENHANCEMENTS:
// ✅ Add uploadAvatar action
// ✅ Add uploadAvatarProgress state
// ✅ Handle avatar upload with progress tracking
// ✅ Update profile with new avatar URL
// ✅ Error handling for upload failures
// ✅ Comprehensive logging
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, ProfileUpdate } from '~/types/auth'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)
  
  // ✅ NEW: Avatar upload state
  const isUploadingAvatar = ref(false)
  const uploadAvatarProgress = ref(0)
  const uploadAvatarError = ref<string | null>(null)

  // ============================================================================
  // COMPUTED PROPERTIES - Profile field accessors
  // ============================================================================
  
  const username = computed(() => {
    return profile.value?.username || 'Unknown'
  })

  const displayName = computed(() => {
    return profile.value?.full_name || profile.value?.username || 'User'
  })

  const avatar = computed(() => {
    return profile.value?.avatar_url || '/default-avatar.png'
  })

  const email = computed(() => {
    return profile.value?.email || ''
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

  const followers = computed(() => {
    return profile.value?.followers_count || 0
  })

  const following = computed(() => {
    return profile.value?.following_count || 0
  })

  const posts = computed(() => {
    return profile.value?.posts_count || 0
  })

  const verified = computed(() => {
    return profile.value?.verified || false
  })

  const isProfileComplete = computed(() => {
    if (!profile.value) return false
    return !!(
      profile.value.username &&
      profile.value.full_name &&
      profile.value.email
    )
  })

  const hasAvatar = computed(() => {
    return !!profile.value?.avatar_url
  })

  // ============================================================================
  // SET PROFILE METHOD
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
      id: newProfile.id,
      username: newProfile.username,
      full_name: newProfile.full_name,
      email: newProfile.email
    })

    profile.value = newProfile

    // ============================================================================
    // PERSIST TO LOCALSTORAGE
    // ============================================================================
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

  // ============================================================================
  // SET LOADING METHOD
  // ============================================================================
  const setLoading = (loading: boolean) => {
    console.log('[Profile Store] Setting loading:', loading)
    isLoading.value = loading
  }

  // ============================================================================
  // SET ERROR METHOD
  // ============================================================================
  const setError = (err: string | null) => {
    error.value = err
    if (err) {
      console.error('[Profile Store] Error:', err)
    } else {
      console.log('[Profile Store] Error cleared')
    }
  }

  // ============================================================================
  // CLEAR PROFILE METHOD
  // ============================================================================
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
  // FETCH PROFILE METHOD
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

      const response = await $fetch('/api/profile/get', {
        method: 'GET',
        query: { userId }
      })

      console.log('[Profile Store] ✅ Profile API response received:', {
        id: response?.id,
        username: response?.username,
        full_name: response?.full_name
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
  // UPDATE PROFILE METHOD
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

      const response = await $fetch('/api/profile/update', {
        method: 'POST',
        body: updates
      })

      console.log('[Profile Store] ✅ Profile update API response received')

      if (!response) {
        console.error('[Profile Store] ❌ No profile data in response')
        setError('Profile update failed')
        return
      }

      // ============================================================================
      // MERGE UPDATED DATA WITH EXISTING PROFILE
      // ============================================================================
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
  // ✅ NEW: UPLOAD AVATAR METHOD
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

    // ============================================================================
    // VALIDATE FILE
    // ============================================================================
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('[Profile Store] ❌ Invalid file type:', file.type)
      uploadAvatarError.value = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      return null
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('[Profile Store] ❌ File size exceeds limit:', file.size)
      uploadAvatarError.value = 'File size exceeds 5MB limit.'
      return null
    }

    isUploadingAvatar.value = true
    uploadAvatarProgress.value = 0
    uploadAvatarError.value = null

    try {
      // ============================================================================
      // CREATE FORMDATA
      // ============================================================================
      const formData = new FormData()
      formData.append('file', file)

      console.log('[Profile Store] FormData created, starting upload...')

      // ============================================================================
      // SIMULATE PROGRESS (since fetch doesn't support real progress)
      // ============================================================================
      const progressInterval = setInterval(() => {
        if (uploadAvatarProgress.value < 90) {
          uploadAvatarProgress.value += Math.random() * 30
        }
      }, 200)

      // ============================================================================
      // UPLOAD FILE
      // ============================================================================
      console.log('[Profile Store] Sending upload request to /api/profile/avatar-upload')

      const response = await fetch('/api/profile/avatar-upload', {
        method: 'POST',
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

      // ============================================================================
      // UPDATE PROFILE WITH NEW AVATAR URL
      // ============================================================================
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

  // ============================================================================
  // ✅ NEW: CLEAR AVATAR UPLOAD ERROR
  // ============================================================================
  const clearAvatarUploadError = () => {
    console.log('[Profile Store] Clearing avatar upload error')
    uploadAvatarError.value = null
  }

  // ============================================================================
  // HYDRATE FROM STORAGE METHOD
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
            id: parsedProfile.id,
            username: parsedProfile.username
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

  // ============================================================================
  // SYNC WITH AUTH STORE METHOD
  // ============================================================================
  const syncWithAuthStore = () => {
    console.log('[Profile Store] Syncing with auth store...')

    try {
      const authStore = useAuthStore()

      if (!authStore.user) {
        console.log('[Profile Store] No auth user, clearing profile')
        clearProfile()
        return
      }

      console.log('[Profile Store] Auth user found:', authStore.user.id)

      // ============================================================================
      // BUILD PROFILE FROM AUTH USER METADATA
      // ============================================================================
      const profileFromAuth: Profile = {
        id: authStore.user.id,
        username: authStore.user.user_metadata?.username || authStore.user.username || 'user',
        username_lower: (authStore.user.user_metadata?.username || authStore.user.username || 'user').toLowerCase(),
        full_name: authStore.user.user_metadata?.full_name || authStore.user.full_name || 'User',
        email: authStore.user.email,
        avatar_url: authStore.user.user_metadata?.avatar_url || authStore.user.avatar_url || null,
        bio: authStore.user.user_metadata?.bio || '',
        location: authStore.user.user_metadata?.location || '',
        website: authStore.user.user_metadata?.website || '',
        verified: authStore.user.user_metadata?.verified || false,
        followers_count: authStore.user.user_metadata?.followers_count || 0,
        following_count: authStore.user.user_metadata?.following_count || 0,
        posts_count: authStore.user.user_metadata?.posts_count || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('[Profile Store] ✅ Profile synced from auth store:', {
        id: profileFromAuth.id,
        username: profileFromAuth.username
      })

      setProfile(profileFromAuth)

    } catch (err) {
      console.error('[Profile Store] ❌ Sync error:', err)
    }
  }

  // ============================================================================
  // INITIALIZE PROFILE METHOD
  // ============================================================================
  const initializeProfile = async (userId: string) => {
    console.log('[Profile Store] ============ INITIALIZE PROFILE START ============')
    console.log('[Profile Store] Initializing profile for user:', userId)

    try {
      // First, try to fetch from API
      await fetchProfile(userId)

      // If fetch failed but we have auth data, sync from auth store
      if (!profile.value) {
        console.log('[Profile Store] Profile fetch failed, syncing from auth store...')
        syncWithAuthStore()
      }

      console.log('[Profile Store] ✅ Profile initialization complete')
      console.log('[Profile Store] ============ INITIALIZE PROFILE END ============')

    } catch (err) {
      console.error('[Profile Store] ❌ Initialization error:', err)
      console.log('[Profile Store] ============ INITIALIZE PROFILE END ============')
    }
  }

  // ============================================================================
  // RETURN STORE
  // ============================================================================
  return {
    // State
    profile,
    isLoading,
    error,
    isHydrated,
    
    // ✅ NEW: Avatar upload state
    isUploadingAvatar,
    uploadAvatarProgress,
    uploadAvatarError,

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

    // Methods
    setProfile,
    setLoading,
    setError,
    clearProfile,
    fetchProfile,
    updateProfile,
    
    // ✅ NEW: Avatar upload methods
    uploadAvatar,
    clearAvatarUploadError,
    
    hydrateFromStorage,
    syncWithAuthStore,
    initializeProfile
  }
})
