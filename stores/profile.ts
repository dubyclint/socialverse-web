 FIXED FILE 3: /stores/profile.ts
# ============================================================================
# PROFILE STORE - FIXED: Proper localStorage management
# ============================================================================
# ✅ FIXED: Added cacheProfile() method
# ✅ FIXED: Added restoreProfileFromCache() method
# ✅ FIXED: Centralized localStorage access for profile data
# ✅ FIXED: Proper hydration handling
# ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  verification_status: string
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const ranks = ref<any[]>([])
  const wallets = ref<any[]>([])
  const privacySettings = ref<any>(null)
  const userSettings = ref<any>(null)
  const walletLock = ref<any>(null)
  const interests = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isCached = ref(false)

  // ============================================================================
  // COMPUTED
  // ============================================================================
  const profileId = computed(() => profile.value?.id || null)
  const profileUsername = computed(() => profile.value?.username || null)
  const profileEmail = computed(() => profile.value?.email || null)
  const isProfileComplete = computed(() => profile.value?.profile_completed || false)
  const isVerified = computed(() => profile.value?.is_verified || false)

  // ============================================================================
  // ✅ FIXED: Set Profile
  // ============================================================================
  const setProfile = (newProfile: Profile) => {
    profile.value = newProfile
    console.log('[ProfileStore] ✅ Profile set:', newProfile.id)
    
    // ✅ Cache profile to localStorage
    cacheProfile(newProfile)
  }

  // ============================================================================
  // ✅ FIXED: Set Profile Data (Multiple fields)
  // ============================================================================
  const setProfileData = (data: any) => {
    profile.value = data.profile
    ranks.value = data.ranks || []
    wallets.value = data.wallets || []
    privacySettings.value = data.privacySettings || {}
    userSettings.value = data.userSettings || {}
    walletLock.value = data.walletLock || {}
    interests.value = data.interests || []
    console.log('[ProfileStore] ✅ Profile data set')
    
    // ✅ Cache profile data
    if (data.profile) {
      cacheProfile(data.profile)
    }
  }

  // ============================================================================
  // ✅ FIXED: Update Profile
  // ============================================================================
  const updateProfile = (updates: Partial<Profile>) => {
    if (profile.value) {
      profile.value = { ...profile.value, ...updates }
      console.log('[ProfileStore] ✅ Profile updated')
      
      // ✅ Update cache
      cacheProfile(profile.value)
    }
  }

  // ============================================================================
  // ✅ FIXED: Cache Profile to localStorage
  // ============================================================================
  const cacheProfile = (profileData: Profile) => {
    if (!process.client) return

    try {
      const cacheKey = `profile_${profileData.id}`
      localStorage.setItem(cacheKey, JSON.stringify(profileData))
      localStorage.setItem('profile_cache_timestamp', Date.now().toString())
      console.log('[ProfileStore] ✅ Profile cached to localStorage:', cacheKey)
    } catch (err) {
      console.error('[ProfileStore] ❌ Failed to cache profile:', err)
    }
  }

  // ============================================================================
  // ✅ FIXED: Restore Profile from Cache
  // ============================================================================
  const restoreProfileFromCache = (userId: string): Profile | null => {
    if (!process.client) return null

    try {
      const cacheKey = `profile_${userId}`
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const profileData = JSON.parse(cached)
        profile.value = profileData
        isCached.value = true
        console.log('[ProfileStore] ✅ Profile restored from cache:', cacheKey)
        return profileData
      }
    } catch (err) {
      console.error('[ProfileStore] ❌ Failed to restore profile from cache:', err)
      // Clear corrupted cache
      try {
        localStorage.removeItem(`profile_${userId}`)
      } catch (e) {
        // Ignore
      }
    }

    return null
  }

  // ============================================================================
  // ✅ FIXED: Clear Profile Cache
  // ============================================================================
  const clearProfileCache = (userId?: string) => {
    if (!process.client) return

    try {
      if (userId) {
        const cacheKey = `profile_${userId}`
        localStorage.removeItem(cacheKey)
        console.log('[ProfileStore] ✅ Profile cache cleared:', cacheKey)
      } else {
        // Clear all profile caches
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('profile_')) {
            localStorage.removeItem(key)
          }
        })
        localStorage.removeItem('profile_cache_timestamp')
        console.log('[ProfileStore] ✅ All profile caches cleared')
      }
    } catch (err) {
      console.error('[ProfileStore] ❌ Failed to clear profile cache:', err)
    }
  }

  // ============================================================================
  // ✅ FIXED: Clear Profile
  // ============================================================================
  const clearProfile = () => {
    const userId = profile.value?.id
    
    profile.value = null
    ranks.value = []
    wallets.value = []
    privacySettings.value = null
    userSettings.value = null
    walletLock.value = null
    interests.value = []
    loading.value = false
    error.value = null
    isCached.value = false
    
    console.log('[ProfileStore] ✅ Profile cleared')
    
    // ✅ Clear cache
    if (userId) {
      clearProfileCache(userId)
    }
  }

  // ============================================================================
  // ✅ FIXED: Set Loading
  // ============================================================================
  const setLoading = (value: boolean) => {
    loading.value = value
  }

  // ============================================================================
  // ✅ FIXED: Set Error
  // ============================================================================
  const setError = (value: string | null) => {
    error.value = value
    if (value) {
      console.error('[ProfileStore] Error:', value)
    }
  }

  // ============================================================================
  // ✅ FIXED: Update Interests
  // ============================================================================
  const updateInterests = (newInterests: any[]) => {
    interests.value = newInterests
    console.log('[ProfileStore] ✅ Interests updated')
  }

  // ============================================================================
  // ✅ FIXED: Update Privacy Settings
  // ============================================================================
  const updatePrivacySettings = (settings: any) => {
    privacySettings.value = settings
    console.log('[ProfileStore] ✅ Privacy settings updated')
  }

  // ============================================================================
  // ✅ FIXED: Update User Settings
  // ============================================================================
  const updateUserSettings = (settings: any) => {
    userSettings.value = settings
    console.log('[ProfileStore] ✅ User settings updated')
  }

  return {
    // State
    profile,
    ranks,
    wallets,
    privacySettings,
    userSettings,
    walletLock,
    interests,
    loading,
    error,
    isCached,

    // Computed
    profileId,
    profileUsername,
    profileEmail,
    isProfileComplete,
    isVerified,

    // Methods
    setProfile,
    setProfileData,
    updateProfile,
    cacheProfile,
    restoreProfileFromCache,
    clearProfileCache,
    clearProfile,
    setLoading,
    setError,
    updateInterests,
    updatePrivacySettings,
    updateUserSettings
  }
})
