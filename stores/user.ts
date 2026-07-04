// stores/user.ts
import { defineStore } from 'pinia'
import { authService } from '~/services/authService'
import { profileService } from '~/services/profileService'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const profile = ref(null)
  const isLoading = ref(false)

  // ORCHESTRATION: One action to rule them all
  const signIn = async (email, password) => {
    isLoading.value = true
    try {
      // 1. Auth Step
      const { data, error } = await authService.signIn(email, password)
      if (error) throw error

      // 2. Profile Step
      user.value = data.user
      profile.value = await profileService.getMe() // Fetch profile immediately
      
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    } finally {
      isLoading.value = false
    }
  }

  return { user, profile, isLoading, signIn }
})
