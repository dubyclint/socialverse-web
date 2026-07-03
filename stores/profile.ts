// stores/profile.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { profileService } from '~/services/profileService'
import { useAuthStore } from '~/stores/auth'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const isLoading = ref(false)

  // Actions now delegate to the Service Layer
  const fetchProfile = async () => {
    isLoading.value = true
    try {
      profile.value = await profileService.getMe()
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (data: any) => {
    profile.value = await profileService.update(data)
  }

  const updateStreamConfig = async (data: { title: string; quality: string }) => {
    const auth = useAuthStore()
    const updated = await profileService.updateStreamConfig(auth.userId, data)
    if (profile.value) {
      profile.value = { ...profile.value, ...updated }
    }
  }

  return { profile, isLoading, fetchProfile, updateProfile, updateStreamConfig }
})
