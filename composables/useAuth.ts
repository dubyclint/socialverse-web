// FILE: /composables/useAuth.ts - FIXED VERSION
// ============================================================================

import { ref, computed } from 'vue'

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!authStore.token)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)

  const extractErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err
    if (err?.data?.statusMessage) return err.data.statusMessage
    if (err?.statusMessage) return err.statusMessage
    if (err?.message) return err.message
    if (err?.error) return err.error
    return 'An error occurred'
  }

  const signup = async (email: string, password: string, username: string) => {
    try {
      loading.value = true
      error.value = ''

      console.log('[useAuth] Signup attempt:', { email, username })

      // CRITICAL FIX: Use baseURL explicitly
      const response = await $fetch<any>('/api/auth/signup', {
        method: 'POST',
        body: { email, password, username },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('[useAuth] Signup response:', response)

      if (!response) {
        throw new Error('No response from server')
      }

      if (response.success === true) {
        console.log('[useAuth] Signup successful')
        return {
          success: true,
          message: response.message || 'Account created successfully',
          nextStep: response.nextStep || 'email_verification',
          userId: response.userId
        }
      } else {
        throw new Error(response.message || 'Signup failed')
      }
    } catch (err: any) {
      console.error('[useAuth] Signup error:', err)
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = ''

      console.log('[useAuth] Login attempt:', { email })

      // CRITICAL FIX: Use baseURL explicitly
      const response = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('[useAuth] Login response:', response)

      if (!response) {
        throw new Error('No response from server')
      }

      if (response.success === true) {
        console.log('[useAuth] Login successful')
        
        // Store token and user
        authStore.setToken(response.token)
        authStore.setUser(response.user)
        
        // Store in localStorage
        if (process.client) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        }

        return {
          success: true,
          message: response.message || 'Login successful',
          token: response.token,
          user: response.user
        }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (err: any) {
      console.error('[useAuth] Login error:', err)
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      authStore.clearAuth()
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
      await router.push('/auth/login')
    } catch (err) {
      console.error('[useAuth] Logout error:', err)
    }
  }

  return {
    signup,
    login,
    logout,
    loading,
    error,
    isAuthenticated,
    user,
    token
  }
}

