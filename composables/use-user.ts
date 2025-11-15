// composables/use-user.ts
// User data composable - combines auth and profile data

import { ref, computed } from 'vue'

export const useUser = () => {
  const authStore = useAuthStore()
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => !!authStore.token)
  const profile = ref(null)
  const loading = ref(false)
  const error = ref('')

  const fetchUserProfile = async () => {
    if (!isAuthenticated.value) return
    
    loading.value = true
    try {
      const response = await $fetch('/api/users/profile')
      profile.value = response
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch user profile:', err)
    } finally {
      loading.value = false
    }
  }

  const updateUserProfile = async (data: any) => {
    loading.value = true
    try {
      const response = await $fetch('/api/users/profile', {
        method: 'PUT',
        body: data
      })
      profile.value = response
      return response
    } catch (err) {
      error.value = err.message
      console.error('Failed to update user profile:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    profile,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile
  }
}
