// FILE: /composables/useAuth.ts - ENHANCED
// Authentication composable with robust error handling
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
   * Extract error message from various error formats
   */
  const extractErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err
    if (err?.data?.statusMessage) return err.data.statusMessage
    if (err?.statusMessage) return err.statusMessage
    if (err?.message) return err.message
    if (err?.error) return err.error
    return 'An error occurred'
  }

  /**
   * Sign up with email, password, username
   */
  const signup = async (email: string, password: string, username: string) => {
    try {
      loading.value = true
      error.value = ''

      console.log('[useAuth] Signup attempt:', { email, username })

      const response = await $fetch<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          username
        }
      })

      console.log('[useAuth] Signup response:', response)

      // Validate response
      if (!response) {
        throw new Error('No response from server')
      }

      if (response.success === true) {
        console.log('[useAuth] Signup successful')
        return {
          success: true,
          message: response.message || 'Account created successfully',
          nextStep: response.nextStep || 'email_verification',
          userId: response.userId,
          email: response.email
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

      console.log('[useAuth] Login attempt:', { email })

      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      })

      console.log('[useAuth] Login response:', response)

      if (!response?.success || !response?.token || !response?.user) {
        throw new Error(response?.message || 'Login failed')
      }

      // Store token and user data
      authStore.setToken(response.token)
      authStore.setUser(response.user)

      console.log('[useAuth] Login successful')

      return {
        success: true,
        user: response.user
      }
    } catch (err: any) {
      console.error('[useAuth] Login error:', err)
      const errorMessage = extractErrorMessage(err)
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

      if (!response?.success) {
        throw new Error(response?.message || 'Email verification failed')
      }

      return {
        success: true,
        nextStep: response.nextStep
      }
    } catch (err: any) {
      console.error('[useAuth] Verify email error:', err)
      const errorMessage = extractErrorMessage(err)
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

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to resend verification email')
      }

      return {
        success: true,
        message: response.message
      }
    } catch (err: any) {
      console.error('[useAuth] Resend verification error:', err)
      const errorMessage = extractErrorMessage(err)
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
      console.error('[useAuth] Logout error:', err)
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
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

