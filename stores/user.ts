// stores/user.ts (Reconciled)
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { userService } from '~/services/userService'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<any | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const profileMissing = ref(false)

  const userId = computed(() => currentUser.value?.id || null)

  const initializeSession = async () => {
    isLoading.value = true
    try {
      const { data: { session }, error: sessionError } = await userService.getSession()
      if (sessionError) throw new Error(String(sessionError))
      
      currentUser.value = session?.user || null
      isAuthenticated.value = !!session?.user
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserProfile = async (targetUserId: string) => {
    isLoading.value = true
    try {
      const { data, error: profileError } = await userService.getProfile(targetUserId)
      if (profileError) throw profileError
      
      profileMissing.value = !data
      return data
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    await userService.signOut()
    currentUser.value = null
    isAuthenticated.value = false
  }

  return { currentUser, isAuthenticated, isLoading, error, profileMissing, userId, initializeSession, fetchUserProfile, logout }
})
