// FILE: /stores/profile.ts - CREATE
// Profile store
// ============================================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Profile } from '~/types/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const ranks = ref<any[]>([])
  const wallets = ref<any[]>([])
  const privacySettings = ref<any>(null)
  const userSettings = ref<any>(null)
  const walletLock = ref<any>(null)
  const interests = ref<any[]>([])

  const setProfile = (newProfile: Profile) => {
    profile.value = newProfile
  }

  const setProfileData = (data: any) => {
    profile.value = data.profile
    ranks.value = data.ranks || []
    wallets.value = data.wallets || []
    privacySettings.value = data.privacySettings || {}
    userSettings.value = data.userSettings || {}
    walletLock.value = data.walletLock || {}
    interests.value = data.interests || []
  }

  const clearProfile = () => {
    profile.value = null
    ranks.value = []
    wallets.value = []
    privacySettings.value = null
    userSettings.value = null
    walletLock.value = null
    interests.value = []
  }

  return {
    profile,
    ranks,
    wallets,
    privacySettings,
    userSettings,
    walletLock,
    interests,
    setProfile,
    setProfileData,
    clearProfile
  }
})
