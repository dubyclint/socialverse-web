// FILE: /stores/profile.ts - COMPLETE FIXED VERSION
// ============================================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  const setProfile = (newProfile: Profile) => {
    profile.value = newProfile
    console.log('[ProfileStore] Profile set:', newProfile.id)
  }

  const setProfileData = (data: any) => {
    profile.value = data.profile
    ranks.value = data.ranks || []
    wallets.value = data.wallets || []
    privacySettings.value = data.privacySettings || {}
    userSettings.value = data.userSettings || {}
    walletLock.value = data.walletLock || {}
    interests.value = data.interests || []
    console.log('[ProfileStore] Profile data set')
  }

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile.value) {
      profile.value = { ...profile.value, ...updates }
      console.log('[ProfileStore] Profile updated')
    }
  }

  const clearProfile = () => {
    profile.value = null
    ranks.value = []
    wallets.value = []
    privacySettings.value = null
    userSettings.value = null
    walletLock.value = null
    interests.value = []
    loading.value = false
    error.value = null
    console.log('[ProfileStore] Profile cleared')
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const setError = (value: string | null) => {
    error.value = value
  }

  return {
    profile,
    ranks,
    wallets,
    privacySettings,
    userSettings,
    walletLock,
    interests,
    loading,
    error,
    setProfile,
    setProfileData,
    updateProfile,
    clearProfile,
    setLoading,
    setError
  }
})
