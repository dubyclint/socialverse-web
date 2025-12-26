// composables/use-auth.ts - COMPLETE FIXED FILE
// ============================================================================
// LOGOUT FIX: Properly clears all localStorage items and session data
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
    if (err.data?.data?.details) {
      return err.data.data.details
    }
    
    if (err.data?.statusMessage) {
      return err.data.statusMessage
    }
    
    if (err.statusMessage) {
      return err.statusMessage
    }
    
    if (err.data?.message) {
      return err.data.message
    }
    
    if (err.message) {
      return err.message
    }
    
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

      authStore.setToken(result.token)
      authStore.setUser(result.user)
      
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
      console.log('[useAuth] Signup attempt:', { email: data.email, username: data.username })

      // ✅ Validate required fields
      if (!data.email || !data.password || !data.username) {
        throw new Error('Email, password, and username are required')
      }

      // ✅ Call signup API
      const result = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email: data.email.trim(),
          password: data.password,
          username: data.username.trim(),
          fullName: data.fullName?.trim() || null
        }
      })

      console.log('[useAuth] Signup response:', result)

      if (!result?.success) {
        throw new Error(result?.message || 'Signup failed')
      }

      // ✅ Store user data in auth store
      authStore.setUser({
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        full_name: result.user.display_name,
        user_metadata: {
          username: result.user.username,
          full_name: result.user.display_name
        }
      })

      authStore.setUserId(result.user.id)

      // ✅ Store token if provided (for auto-login)
      if (result.token) {
        authStore.setToken(result.token)
        if (result.refreshToken) {
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
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * ✅ FIXED LOGOUT: Properly clears all localStorage items
   */
  const logout = async () => {
    try {
      console.log('[useAuth] Logging out...')
      
      // ✅ STEP 1: Call logout API to clear server-side session
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
        console.log('[useAuth] Server logout successful')
      } catch (apiErr) {
        console.warn('[useAuth] Server logout failed (continuing with client logout):', apiErr)
        // Continue with client-side logout even if API fails
      }

      // ✅ STEP 2: Clear auth store
      authStore.clearAuth()
      userStore.clearSession()

      // ✅ STEP 3: Clear ALL localStorage items related to auth
      if (typeof window !== 'undefined') {
        // Remove specific auth keys
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_user_id')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('session')
        
        // Remove any other session-related items
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('auth') || key.includes('session') || key.includes('user'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }

      // ✅ STEP 4: Clear sessionStorage as well
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
      }

      console.log('[useAuth] ✅ Logout successful - all data cleared')
      return { success: true }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Logout failed:', errorMessage)
      error.value = errorMessage
      
      // ✅ Even if logout fails, still clear local data
      authStore.clearAuth()
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Refresh authentication token
   */
  const refreshToken = async () => {
    try {
      const refreshTokenValue = typeof window !== 'undefined' 
        ? localStorage.getItem('refresh_token') 
        : null

      if (!refreshTokenValue) {
        throw new Error('No refresh token available')
      }

      const result = await $fetch('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refreshTokenValue }
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
      console.log('[useAuth] Verifying email with token...')

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
   * Resend verification email
   */
  const resendVerification = async (email: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Resending verification email for:', email)

      const result = await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })

      console.log('[useAuth] Resend verification response:', result)

      if (result?.success) {
        console.log('[useAuth] ✅ Verification email resent')
        return { success: true, message: result.message }
      }

      throw new Error(result?.error || 'Failed to resend verification email')

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useAuth] ✗ Resend verification failed:', errorMessage)
      console.error('[useAuth] Full error:', err)
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
    loading,
    error,
    isAuthenticated,
    user,
    token,
    
    login,
    signup,
    logout,
    refreshToken,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    checkUsername,
    initAuth
  }
}
