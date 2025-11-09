// FILE: /composables/useAuth.ts - FIXED
// ROOT CAUSE #5: REMOVE CONFLICTING REDIRECTS

import { ref, computed } from 'vue'

export const useAuth = () => {
  const authStore = useAuthStore()
  
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!authStore.token)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)

  /**
   * Extract error message from response
   */
  const extractErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err
    if (err?.message) return err.message
    if (err?.data?.message) return err.data.message
    if (err?.statusMessage) return err.statusMessage
    return 'An error occurred'
  }

  /**
   * Login user
   * Returns success/error without redirecting
   * Parent page handles navigation
   */
  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Login attempt:', email)

      const result = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      })

      console.log('[useAuth] Login successful')

      if (result?.token) {
        authStore.setToken(result.token)
        authStore.setUser(result.user)
        console.log('[useAuth] ✓ Token stored')
        return { success: true, data: result }
      }

      return { success: false, error: 'No token received' }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Login failed:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Signup user
   * Returns success/error without redirecting
   * Parent page handles navigation
   */
  const signup = async (email: string, password: string, username: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Signup attempt:', email, username)

      const result = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          username
        }
      })

      console.log('[useAuth] Signup successful')

      if (result?.token) {
        authStore.setToken(result.token)
        authStore.setUser(result.user)
        console.log('[useAuth] ✓ Token stored')
        return { success: true, message: 'Account created successfully', data: result }
      }

      return { success: false, message: 'Signup failed' }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Signup failed:', errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      console.log('[useAuth] Logout attempt')
      
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      authStore.clearAuth()
      console.log('[useAuth] ✓ Logout successful')
      return { success: true }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Logout failed:', errorMessage)
      authStore.clearAuth()
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Verify email
   */
  const verifyEmail = async (token: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Email verification attempt')

      const result = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: { token }
      })

      console.log('[useAuth] ✓ Email verified')
      return { success: true, data: result }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Email verification failed:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Request password reset
   */
  const requestPasswordReset = async (email: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Password reset request:', email)

      await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })

      console.log('[useAuth] ✓ Password reset email sent')
      return { success: true, message: 'Check your email for reset instructions' }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Password reset request failed:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset password
   */
  const resetPassword = async (token: string, newPassword: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Password reset attempt')

      const result = await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword }
      })

      console.log('[useAuth] ✓ Password reset successful')
      return { success: true, data: result }
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Password reset failed:', errorMessage)
      return { success: false, error: errorMessage }
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
    login,
    signup,
    logout,
    verifyEmail,
    requestPasswordReset,
    resetPassword
  }
}
