import { defineStore } from 'pinia'
import { ref } from 'vue'
import { profileService } from '~/services/profileService'
import { useAuthStore } from '~/stores/auth'

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

  // Add this action to handle the file upload via your service layer
  const uploadAvatar = async (file: File) => {
    const response = await profileService.uploadAvatar(file)
    // Assuming the service returns an object containing the new URL
    const newAvatarUrl = response.avatar_url || response
    if (profile.value) {
      profile.value.avatar_url = newAvatarUrl
    }
    return newAvatarUrl
  }

  const updateStreamConfig = async (data: { title: string; quality: string }) => {
    const auth = useAuthStore()
    if (!auth.userId) throw new Error('No user authenticated')
    
    const updated = await profileService.updateStreamConfig(auth.userId, data)
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
