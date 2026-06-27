// ============================================================================
// FILE: /composables/use-auth-with-error-catcher.ts
// Description: Authentication Orchestration Controller featuring unified error 
//              capture hooks and deferred lazy store initialization.
// ============================================================================
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSignupErrorCatcher } from '~/utils/error-catcher'

export const useAuthWithErrorCatcher = () => {
  const { captureError, printReport, clearErrors } = useSignupErrorCatcher()
  const router = useRouter()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // LAZY STORE RESOLVERS (Decouples top-level initialization references)
  // ============================================================================
  const getAuthStore = async () => {
    const { useAuthStore } = await import('~/stores/auth')
    return useAuthStore()
  }

  const getProfileStore = async () => {
    const { useProfileStore } = await import('~/stores/profile')
    return useProfileStore()
  }

  // ============================================================================
  // METHODS
  // ============================================================================

  const signup = async (email: string, password: string, username: string) => {
    clearErrors()
    isLoading.value = true
    error.value = null

    try {
      if (!email || !password || !username) {
        throw new Error('All entry field parameters are required.')
      }

      const response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password, username: username.trim().toLowerCase() }
      })

      if (!response || !response.success || !response.user) {
        throw new Error(response?.message || 'Server rejected registration profile request sequence.')
      }

      const authStore = await getAuthStore()
      const profileStore = await getProfileStore()

      if (response.token) {
        authStore.setToken(response.token)
      }

      authStore.setUser(response.user)
      authStore.setUserId(response.user.id)
      profileStore.setProfile(response.user)

      return { success: true, message: response.message, user: response.user }

    } catch (err: any) {
      captureError('SIGNUP_PIPELINE_FAULT', err, { email, username })
      error.value = err.message || 'Signup failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    clearErrors()
    isLoading.value = true
    error.value = null

    try {
      if (!email || !password) {
        throw new Error('Email address and password coordinates are required.')
      }

      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), password }
      })

      if (!response?.success || !response.user) {
        throw new Error(response?.message || 'Login credentials rejected.')
      }

      const authStore = await getAuthStore()
      const profileStore = await getProfileStore()

      if (response.token) {
        authStore.setToken(response.token)
      }

      authStore.setUser(response.user)
      profileStore.setProfile(response.user)

      return { success: true, user: response.user }

    } catch (err: any) {
      captureError('LOGIN_PIPELINE_FAULT', err)
      error.value = err.message || 'Authentication failed'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Client-side scoped execution call protection
      if (process.client) {
        const { $supabase } = useNuxtApp() as any
        if ($supabase?.auth) {
          await $supabase.auth.signOut()
        }
      }

      const authStore = await getAuthStore()
      const profileStore = await getProfileStore()

      profileStore.clearProfile()
      authStore.clearAuth()

      await router.push('/signin')
      return { success: true, message: 'Logged out successfully' }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  return { isLoading, error, signup, login, logout, printReport, clearErrors }
}
