// stores/profile.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { profileService } from '~/services/profileService'
import { useUserStore } from '~/stores/user' // Updated import

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<any>(null)
  const isLoading = ref(false)

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

  const uploadAvatar = async (file: File) => {
    const avatarUrl = await profileService.uploadAvatar(file)
    if (profile.value) {
      profile.value.avatar_url = avatarUrl
    }
    return avatarUrl
  }

  const updateStreamConfig = async (data: { title: string; quality: string }) => {
    // Access the unified user store instead of the old auth store
    const userStore = useUserStore()
    if (!userStore.userId) throw new Error('No user authenticated')
    
    const updated = await profileService.updateStreamConfig(userStore.userId, data)
    if (profile.value) {
      profile.value = { ...profile.value, ...updated }
    }
  }

  return { 
    profile, 
    isLoading, 
    fetchProfile, 
    updateProfile, 
    uploadAvatar, 
    updateStreamConfig 
  }
})
