// FILE: /composables/use-auth.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Proper token management, user storage, and detailed error handling
// ============================================================================

import { ref, computed } from 'vue'

export const useAuth = () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!authStore.token)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)

  /**
   * Extract error message from response with detailed error handling
   */
  const extractErrorMessage = (err: any): string => {
    // Check for detailed error in data.data.details (from our API)
    if (err.data?.data?.details) {
      return err.data.data.details
    }
    
    // Check for statusMessage in data
    if (err.data?.statusMessage) {
      return err.data.statusMessage
    }
    
    // Check for direct statusMessage
    if (err.statusMessage) {
      return err.statusMessage
    }
    
    // Check for message in data
    if (err.data?.message) {
      return err.data.message
    }
    
    // Check for direct message
    if (err.message) {
      return err.message
    }
    
    // Check if it's a string
    if (typeof err === 'string') {
      return err
    }
    
    return 'An error occurred'
  }

  /**
   * Login user
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

      console.log('[useAuth] Login response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Login failed')
      }

      if (!result.token) {
        throw new Error('No token received from server')
      }

      // Store token and user data
      authStore.setToken(result.token)
      authStore.setUser(result.user)
      
      // Store refresh token if provided
      if (result.refreshToken && typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', result.refreshToken)
      }

      console.log('[useAuth] ✅ Login successful')
      return { success: true, data: result }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Login failed:', errorMessage)
      console.error('[useAuth] Full error:', err)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Signup user with detailed error handling
   */
  const signup = async (data: {
    email: string
    password: string
    username: string
    fullName?: string
    phone?: string
    bio?: string
    location?: string
  }) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Signup attempt:', data.email)

      const result = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: data
      })

      console.log('[useAuth] Signup response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Signup failed')
      }

      // If email confirmation is not needed and we have a token, auto-login
      if (!result.needsConfirmation && result.token) {
        authStore.setToken(result.token)
        authStore.setUser(result.user)
        
        if (result.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', result.refreshToken)
        }
      }

      console.log('[useAuth] ✅ Signup successful')
      return { 
        success: true, 
        data: result,
        needsConfirmation: result.needsConfirmation,
        message: result.message
      }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Signup failed:', errorMessage)
      console.error('[useAuth] Full error:', err)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      console.log('[useAuth] Logging out...')
      
      // Call logout API
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      // Clear auth store
      authStore.clearAuth()
      userStore.clearSession()

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      }

      console.log('[useAuth] ✅ Logout successful')
      return { success: true }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Logout failed:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Refresh authentication token
   */
  const refreshToken = async () => {
    try {
      const refreshToken = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const result = await $fetch('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken }
      })

      if (result?.token) {
        authStore.setToken(result.token)
        if (result.refreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', result.refreshToken)
        }
        return { success: true }
      }

      throw new Error('Token refresh failed')

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Token refresh failed:', errorMessage)
      
      // Clear auth on refresh failure
      authStore.clearAuth()
      userStore.clearSession()
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Verify email with token
   */
  const verifyEmail = async (token: string) => {
    loading.value = true
    error.value = ''

    try {
      const result = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: { token }
      })

      if (result?.success) {
        console.log('[useAuth] ✅ Email verified')
        return { success: true }
      }

      throw new Error(result?.error || 'Email verification failed')

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Email verification failed:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Request password reset
   */
  const forgotPassword = async (email: string) => {
    loading.value = true
    error.value = ''

    try {
      const result = await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })

      if (result?.success) {
        console.log('[useAuth] ✅ Password reset email sent')
        return { success: true, message: result.message }
      }

      throw new Error(result?.error || 'Password reset request failed')

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Password reset failed:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset password with token
   */
  const resetPassword = async (token: string, newPassword: string) => {
    loading.value = true
    error.value = ''

    try {
      const result = await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password: newPassword }
      })

      if (result?.success) {
        console.log('[useAuth] ✅ Password reset successful')
        return { success: true }
      }

      throw new Error(result?.error || 'Password reset failed')

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Password reset failed:', errorMessage)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if username is available
   */
  const checkUsername = async (username: string) => {
    try {
      const result = await $fetch('/api/auth/check-username', {
        method: 'POST',
        body: { username }
      })

      return { 
        available: result?.available || false,
        message: result?.message 
      }

    } catch (err: any) {
      console.error('[useAuth] Username check failed:', err)
      return { available: false, message: 'Failed to check username' }
    }
  }

  /**
   * Initialize auth from stored token
   */
  const initAuth = async () => {
    if (typeof window === 'undefined') return

    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) return

    try {
      // Verify token is still valid
      const result = await $fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })

      if (result?.user) {
        authStore.setToken(storedToken)
        authStore.setUser(result.user)
        console.log('[useAuth] ✅ Auth initialized from stored token')
      }
    } catch (err) {
      console.warn('[useAuth] Stored token invalid, clearing auth')
      authStore.clearAuth()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }

  return {
    // State
    loading,
    error,
    isAuthenticated,
    user,
    token,
    
    // Methods
    login,
    signup,
    logout,
    refreshToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
    checkUsername,
    initAuth
  }
}

