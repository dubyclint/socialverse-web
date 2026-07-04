// composables/use-user.ts
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'

export const useUser = () => {
  const userStore = useUserStore()
  
  // Reactive state
  const profile = ref<any>(null)
  const loading = ref(false)
  const error = ref('')

  // Map to unified store properties
  const user = computed(() => userStore.user)
  const isAuthenticated = computed(() => userStore.isAuthenticated)

  // CORE API ACTIONS
  const fetchUserProfile = async () => {
    if (!isAuthenticated.value) return
    
    loading.value = true
    error.value = ''
    try {
      // Use unified store for token and logic
      const response = await $fetch<any>('/api/users/profile', {
        headers: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : undefined
      })
      profile.value = response
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch profile data.'
      console.error('[useUser] Failed to fetch user profile:', err)
    } finally {
      loading.value = false
    }
  }

  const updateUserProfile = async (data: any) => {
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch<any>('/api/users/profile', {
        method: 'PUT',
        headers: userStore.token ? { Authorization: `Bearer ${userStore.token}` } : undefined,
        body: data
      })
      profile.value = response
      return response
    } catch (err: any) {
      error.value = err?.message || 'Failed to update profile.'
      return null
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
