// stores/user.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService } from '~/services/authService'
import { profileService } from '~/services/profileService'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const profile = ref(null)
  const isLoading = ref(false)
  const error = ref(null) // Added
  const rememberMe = ref(false) // Added

  const setError = (val: any) => { error.value = val }
  const setRememberMe = (val: boolean) => { rememberMe.value = val }

  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    error.value = null // Clear previous error
    try {
      const { data, error: authErr } = await authService.signIn(email, password)
      if (authErr) throw authErr

      user.value = data.user
      profile.value = await profileService.getMe()
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      isLoading.value = false
    }
  }

  return { user, profile, isLoading, error, rememberMe, setError, setRememberMe, signIn }
})
