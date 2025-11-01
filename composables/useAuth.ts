// FILE: /composables/useAuth.ts - CORRECTED
// Authentication composable
// ============================================================================

import { ref, computed } from 'vue'
import type { LoginRequest, SignupRequest, AuthResponse, User } from '~/types/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!authStore.token)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)

  /**
   * Sign up with email, password, username
   */
  const signup = async (email: string, password: string, username: string) => {
    try {
      loading.value = true
      error.value = ''

      console.log('[useAuth] Signup attempt:', { email, username })

      const response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          username
        }
      })

      console.log('[useAuth] Signup response:', response)

      // Check if response has success property
      if (response && response.success === true) {
        console.log('[useAuth] Signup successful')
        return {
          success: true,
          message: response.message || 'Account created successfully',
          nextStep: response.nextStep || 'email_verification',
          userId: response.userId,
          email: response.email
        }
      } else if (response && response.success === false) {
        throw new Error(response.message || 'Signup failed')
      } else {
        // Response might not have success property, assume it's an error
        throw new Error(response?.message || 'Signup failed - invalid response')
      }

    } catch (err: any) {
      console.error('[useAuth] Signup error:', err)
      
      // Extract error message
      let errorMessage = 'Signup failed'
      
      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      })

      if (!response.success || !response.token || !response.user) {
        throw new Error(response.message || 'Login failed')
      }

      // Store token and user data
      authStore.setToken(response.token)
      authStore.setUser(response.user)

      // Set auth header for future requests
      const headers = useRequestHeaders(['cookie'])
      headers['Authorization'] = `Bearer ${response.token}`

      return {
        success: true,
        user: response.user
      }
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      console.error('[useAuth] Login error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Verify email with token
   */
  const verifyEmail = async (token: string) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<AuthResponse>('/api/auth/verify-email', {
        method: 'POST',
        body: { token }
      })

      if (!response.success) {
        throw new Error(response.message || 'Email verification failed')
      }

      return {
        success: true,
        nextStep: response.nextStep
      }
    } catch (err: any) {
      error.value = err.message || 'Email verification failed'
      console.error('[useAuth] Verify email error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Resend verification email
   */
  const resendVerification = async (email: string) => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<AuthResponse>('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email')
      }

      return {
        success: true,
        message: response.message
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to resend verification email'
      console.error('[useAuth] Resend verification error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    try {
      loading.value = true
      error.value = ''

      await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      // Clear auth data
      authStore.clearAuth()

      // Redirect to login
      await router.push('/auth/signin')

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
      console.error('[useAuth] Logout error:', err)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    isAuthenticated,
    user,
    token,
    signup,
    login,
    verifyEmail,
    resendVerification,
    logout
  }
}
