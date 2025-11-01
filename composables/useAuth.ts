// FILE: /composables/useAuth.ts - UPDATE
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

      const response = await $fetch<AuthResponse>('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          username
        }
      })

      if (!response.success) {
        throw new Error(response.message || 'Signup failed')
      }

      return {
        success: true,
        message: response.message,
        nextStep: response.nextStep
      }
    } catch (err: any) {
      error.value = err.message || 'Signup failed'
      console.error('[useAuth] Signup error:', err)
      return {
        success: false,
        error: error.value
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
   * Check username availability
   */
  const checkUsername = async (username: string) => {
    try {
      const response = await $fetch('/api/auth/check-username', {
        method: 'POST',
        body: { username }
      })

      return response
    } catch (err: any) {
      console.error('[useAuth] Check username error:', err)
      return {
        available: false,
        reason: 'Error checking username'
      }
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
    checkUsername,
    logout
  }
}
