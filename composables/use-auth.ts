// FILE: /composables/use-auth.ts - COMPLETE FIXED VERSION
// ============================================================================
// AUTH COMPOSABLE - FIXED: Proper token management, user storage, and error handling
// ✅ FIXED: Proper signup with profile creation
// ✅ FIXED: Login with token management
// ✅ FIXED: Logout with cleanup
// ✅ FIXED: Email verification resend
// ✅ FIXED: Password reset
// ✅ FIXED: Comprehensive error handling
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
   * Signup user
   */
  const signup = async (email: string, password: string, username: string, fullName: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Signup attempt:', { email, username })

      const result = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          username,
          fullName
        }
      })

      console.log('[useAuth] Signup response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Signup failed')
      }

      // ✅ FIXED: Store user data in auth store
      authStore.setUser(result.user)
      authStore.setUserId(result.user.id)

      // ✅ FIXED: Fetch and store full profile
      try {
        const profileResult = await $fetch('/api/profile/me')
        if (profileResult?.success) {
          const profileStore = useProfileStore()
          profileStore.setProfile(profileResult.data)
        }
      } catch (profileErr) {
        console.warn('[useAuth] Warning: Could not fetch profile after signup:', profileErr)
      }

      // ✅ FIXED: Redirect to profile completion page
      await navigateTo('/profile/complete')

      return result
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Signup error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
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

      // ✅ Store token and user
      authStore.setToken(result.token)
      authStore.setUser(result.user)
      authStore.setUserId(result.user.id)

      // ✅ Fetch and store full profile
      try {
        const profileResult = await $fetch('/api/profile/me')
        if (profileResult?.success) {
          const profileStore = useProfileStore()
          profileStore.setProfile(profileResult.data)
        }
      } catch (profileErr) {
        console.warn('[useAuth] Warning: Could not fetch profile after login:', profileErr)
      }

      // ✅ Redirect to feed
      await navigateTo('/feed')

      return result
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Login error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    loading.value = true
    error.value = ''

    try {
      console.log('[useAuth] Logout attempt')

      // Call logout endpoint
      await $fetch('/api/auth/logout', {
        method: 'POST'
      }).catch(err => {
        console.warn('[useAuth] Logout endpoint error:', err)
        // Continue with local logout even if endpoint fails
      })

      // ✅ Clear auth store
      authStore.clearAuth()

      // ✅ Clear profile store
      const profileStore = useProfileStore()
      profileStore.clearProfile()

      // ✅ Redirect to login
      await navigateTo('/login')

      console.log('[useAuth] Logout successful')
      return { success: true }
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Logout error:', errorMsg)
      
      // Still clear local state even if error
      authStore.clearAuth()
      const profileStore = useProfileStore()
      profileStore.clearProfile()
      
      throw err
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
      console.log('[useAuth] Resend verification attempt:', email)

      const result = await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })

      console.log('[useAuth] Resend verification response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to resend verification email')
      }

      return result
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Resend verification error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Verify email with token
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

      console.log('[useAuth] Email verification response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Email verification failed')
      }

      // ✅ Update user in store
      if (result.user) {
        authStore.setUser(result.user)
      }

      return result
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Email verification error:', errorMsg)
      throw err
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

      const result = await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })

      console.log('[useAuth] Password reset request response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to send reset email')
      }

      return result
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Password reset request error:', errorMsg)
      throw err
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
      console.log('[useAuth] Password reset attempt')

      const result = await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          newPassword
        }
      })

      console.log('[useAuth] Password reset response:', result)

      if (!result?.success) {
        throw new Error(result?.error || 'Password reset failed')
      }

      return result
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err)
      error.value = errorMsg
      console.error('[useAuth] Password reset error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if username is available
   */
  const checkUsernameAvailability = async (username: string) => {
    try {
      console.log('[useAuth] Checking username availability:', username)

      const result = await $fetch('/api/auth/check-username', {
        method: 'POST',
        body: { username }
      })

      console.log('[useAuth] Username check response:', result)
      return result?.available || false
    } catch (err: any) {
      console.error('[useAuth] Username check error:', err)
      return false
    }
  }

  /**
   * Hydrate auth state from localStorage
   */
  const hydrate = () => {
    console.log('[useAuth] Hydrating auth state')
    authStore.hydrate()
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    error.value = ''
  }

  return {
    // State
    loading,
    error,
    isAuthenticated,
    user,
    token,

    // Methods
    signup,
    login,
    logout,
    resendVerification,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    checkUsernameAvailability,
    hydrate,
    clearError,

    // Store access
    authStore
  }
}
