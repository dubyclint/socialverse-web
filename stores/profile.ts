// stores/profile.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { profileService } from '~/services/profileService'
import { useUserStore } from '~/stores/user'
import type { Profile } from '~/types/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const isLoading = ref<boolean>(false)

  const setProfile = (value: Profile | null): void => {
    profile.value = value
  }

  const fetchProfile = async (): Promise<void> => {
    isLoading.value = true
    try {
      profile.value = await profileService.getMe()
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (data: any): Promise<void> => {
    profile.value = await profileService.update(data)
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    const avatarUrl = await profileService.uploadAvatar(file)
    if (profile.value) {
      profile.value.avatar_url = avatarUrl
    }
    return avatarUrl
  }

  const updateStreamConfig = async (data: { title: string; quality: string }): Promise<void> => {
    const userStore = useUserStore()
    // userStore exposes 'user' object; use user?.id or user?.user_id depending on shape
    const uid = (userStore as any).user?.id || (userStore as any).user?.user_id
    if (!uid) throw new Error('No user authenticated')

    const updated = await profileService.updateStreamConfig(uid, data)
    if (profile.value) {
      profile.value = { ...profile.value, ...updated }
    }
  }

  return {
    profile,
    isLoading,
    setProfile,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    updateStreamConfig
  }
})
