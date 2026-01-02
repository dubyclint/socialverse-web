// ============================================================================
// FILE 3: /composables/use-auth.ts - COMPLETE FIXED VERSION
// ============================================================================
// FIXES:
// ✅ Ensures token is set from signup response
// ✅ Better error handling and logging
// ✅ Verify user data is properly stored
// ✅ Improved token persistence
// ✅ Better error messages
// ============================================================================

import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // SIGNUP METHOD - IMPROVED WITH BETTER TOKEN HANDLING
  // ============================================================================
  const signup = async (credentials: {
    email: string
    password: string
    username: string
    fullName?: string
    phone?: string
    bio?: string
    location?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ SIGNUP START ============')
      console.log('[useAuth] Signup attempt:', {
        email: credentials.email,
        username: credentials.username,
        fullName: credentials.fullName
      })

      // ============================================================================
      // CLIENT-SIDE VALIDATION
      // ============================================================================
      console.log('[useAuth] Performing client-side validation...')
      
      if (!credentials.email || !credentials.password || !credentials.username) {
        const validationError = 'Email, password, and username are required'
        console.error('[useAuth] ❌ Validation failed:', validationError)
        throw new Error(validationError)
      }

      if (credentials.password.length < 6) {
        const validationError = 'Password must be at least 6 characters'
        console.error('[useAuth] ❌ Validation failed:', validationError)
        throw new Error(validationError)
      }

      if (credentials.username.length < 3) {
        const validationError = 'Username must be at least 3 characters'
        console.error('[useAuth] ❌ Validation failed:', validationError)
        throw new Error(validationError)
      }

      console.log('[useAuth] ✅ Client validation passed')

      // ============================================================================
      // CALL SIGNUP API
      // ============================================================================
      console.log('[useAuth] Calling signup API...')

      const response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: credentials
      })

      console.log('[useAuth] ✅ Signup API response received:', {
        success: response.success,
        userId: response.user?.id,
        hasToken: !!response.token,
        needsConfirmation: response.needsConfirmation
      })

      // ============================================================================
      // HANDLE SIGNUP RESPONSE
      // ============================================================================
      if (!response.success) {
        const apiError = response.message || 'Signup failed'
        console.error('[useAuth] ❌ API returned success: false -', apiError)
        throw new Error(apiError)
      }

      if (!response.user) {
        const apiError = 'No user data returned from signup'
        console.error('[useAuth] ❌', apiError)
        throw new Error(apiError)
      }

      console.log('[useAuth] ✅ Signup successful, user data received')

      // ============================================================================
      // SET USER IN AUTH STORE
      // ============================================================================
      console.log('[useAuth] Setting user in auth store...')
      
      // Create complete user object with all metadata
      const completeUser = {
        id: response.user.id,
        email: response.user.email,
        user_metadata: {
          username: response.user.username,
          full_name: response.user.display_name || response.user.fullName,
          avatar_url: response.user.avatar_url || null
        }
      }

      authStore.setUser(completeUser)
      console.log('[useAuth] ✅ User set in auth store:', {
        id: completeUser.id,
        email: completeUser.email,
        username: completeUser.user_metadata.username
      })

      // ============================================================================
      // SET TOKEN IN AUTH STORE - ✅ FIXED
      // ============================================================================
      console.log('[useAuth] Handling token from signup response...')
      
      if (response.token) {
        console.log('[useAuth] ✅ Token received from API, setting in store')
        authStore.setToken(response.token)
        console.log('[useAuth] ✅ Token set in auth store')
      } else {
        console.warn('[useAuth] ⚠️ No token in signup response')
        // This is OK for email verification flow - user will get token after verification
      }

      // ============================================================================
      // SET REFRESH TOKEN IF PROVIDED
      // ============================================================================
      if (response.refreshToken) {
        console.log('[useAuth] ✅ Refresh token received, storing in localStorage')
        if (process.client) {
          localStorage.setItem('auth_refresh_token', response.refreshToken)
        }
      }

      console.log('[useAuth] ============ SIGNUP END ============')

      return {
        success: true,
        message: response.message || 'Account created successfully!',
        user: response.user,
        token: response.token || null,
        needsConfirmation: response.needsConfirmation || false
      }

    } catch (err: any) {
      console.error('[useAuth] ============ SIGNUP ERROR ============')
      console.error('[useAuth] Error type:', err.constructor.name)
      console.error('[useAuth] Error message:', err.message)
      
      // Extract error message from different error formats
      let errorMessage = 'Signup failed. Please try again.'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
        console.error('[useAuth] Error from API:', errorMessage)
      } else if (err.message) {
        errorMessage = err.message
        console.error('[useAuth] Error from exception:', errorMessage)
      } else if (typeof err === 'string') {
        errorMessage = err
        console.error('[useAuth] Error from string:', errorMessage)
      }

      console.error('[useAuth] ============ END ERROR ============')
      
      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // LOGIN METHOD - IMPROVED WITH BETTER TOKEN HANDLING
  // ============================================================================
  const login = async (credentials: {
    email: string
    password: string
    rememberMe?: boolean
  }) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ LOGIN START ============')
      console.log('[useAuth] Login attempt:', { email: credentials.email })

      // ============================================================================
      // CLIENT-SIDE VALIDATION
      // ============================================================================
      console.log('[useAuth] Performing client-side validation...')
      
      if (!credentials.email || !credentials.password) {
        const validationError = 'Email and password are required'
        console.error('[useAuth] ❌ Validation failed:', validationError)
        throw new Error(validationError)
      }

      console.log('[useAuth] ✅ Client validation passed')

      // ============================================================================
      // CALL LOGIN API
      // ============================================================================
      console.log('[useAuth] Calling login API...')

      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password
        }
      })

      console.log('[useAuth] ✅ Login API response received:', {
        success: response.success,
        userId: response.user?.id,
        hasToken: !!response.token
      })

      // ============================================================================
      // HANDLE LOGIN RESPONSE
      // ============================================================================
      if (!response.success) {
        const apiError = response.message || 'Login failed'
        console.error('[useAuth] ❌ API returned success: false -', apiError)
        throw new Error(apiError)
      }

      if (!response.user) {
        const apiError = 'No user data returned from login'
        console.error('[useAuth] ❌', apiError)
        throw new Error(apiError)
      }

      console.log('[useAuth] ✅ Login successful, user data received')

      // ============================================================================
      // SET USER IN AUTH STORE
      // ============================================================================
      console.log('[useAuth] Setting user in auth store...')
      
      // Create complete user object with all metadata
      const completeUser = {
        id: response.user.id,
        email: response.user.email,
        user_metadata: {
          username: response.user.username,
          full_name: response.user.full_name,
          avatar_url: response.user.avatar_url || null
        }
      }

      authStore.setUser(completeUser)
      console.log('[useAuth] ✅ User set in auth store:', {
        id: completeUser.id,
        email: completeUser.email,
        username: completeUser.user_metadata.username
      })

      // ============================================================================
      // SET TOKEN IN AUTH STORE - ✅ FIXED
      // ============================================================================
      console.log('[useAuth] Handling token from login response...')
      
      if (response.token) {
        console.log('[useAuth] ✅ Token received from API, setting in store')
        authStore.setToken(response.token)
        console.log('[useAuth] ✅ Token set in auth store')
      } else {
        const tokenError = 'No token in login response'
        console.error('[useAuth] ❌', tokenError)
        throw new Error(tokenError)
      }

      // ============================================================================
      // SET REFRESH TOKEN IF PROVIDED
      // ============================================================================
      if (response.refreshToken) {
        console.log('[useAuth] ✅ Refresh token received, storing in localStorage')
        if (process.client) {
          localStorage.setItem('auth_refresh_token', response.refreshToken)
        }
      }

      // ============================================================================
      // HANDLE REMEMBER ME
      // ============================================================================
      if (credentials.rememberMe) {
        console.log('[useAuth] Setting remember me preference')
        authStore.setRememberMe(true)
      }

      console.log('[useAuth] ============ LOGIN END ============')

      return {
        success: true,
        message: 'Login successful!',
        user: response.user
      }

    } catch (err: any) {
      console.error('[useAuth] ============ LOGIN ERROR ============')
      console.error('[useAuth] Error type:', err.constructor.name)
      console.error('[useAuth] Error message:', err.message)
      
      let errorMessage = 'Login failed. Please try again.'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
        console.error('[useAuth] Error from API:', errorMessage)
      } else if (err.message) {
        errorMessage = err.message
        console.error('[useAuth] Error from exception:', errorMessage)
      }

      console.error('[useAuth] ============ END ERROR ============')
      
      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // LOGOUT METHOD
  // ============================================================================
  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ LOGOUT START ============')
      console.log('[useAuth] Logout attempt')

      await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      console.log('[useAuth] ✅ Logout API call successful')
      console.log('[useAuth] Clearing auth store...')
      
      authStore.clearAuth()
      
      console.log('[useAuth] ✅ Auth store cleared')
      console.log('[useAuth] ============ LOGOUT END ============')

      return {
        success: true,
        message: 'Logged out successfully'
      }
    } catch (err: any) {
      console.error('[useAuth] ============ LOGOUT ERROR ============')
      console.error('[useAuth] Error:', err.message)
      
      // Clear auth anyway even if API call fails
      console.log('[useAuth] Clearing auth store despite error...')
      authStore.clearAuth()
      
      console.error('[useAuth] ============ END ERROR ============')
      
      return {
        success: true,
        message: 'Logged out'
      }
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // VERIFY EMAIL METHOD
  // ============================================================================
  const verifyEmail = async (token: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ VERIFY EMAIL START ============')
      console.log('[useAuth] Verifying email with token...')

      const response = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: { token }
      })

      console.log('[useAuth] ✅ Email verified successfully')
      console.log('[useAuth] ============ VERIFY EMAIL END ============')

      return {
        success: true,
        message: 'Email verified successfully!'
      }
    } catch (err: any) {
      console.error('[useAuth] ============ VERIFY EMAIL ERROR ============')
      console.error('[useAuth] Error:', err.message)
      
      let errorMessage = 'Email verification failed'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      
      console.error('[useAuth] ============ END ERROR ============')
      
      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // RESET PASSWORD METHOD
  // ============================================================================
  const resetPassword = async (email: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ RESET PASSWORD START ============')
      console.log('[useAuth] Requesting password reset for:', email)

      const response = await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { email }
      })

      console.log('[useAuth] ✅ Password reset email sent')
      console.log('[useAuth] ============ RESET PASSWORD END ============')

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      }
    } catch (err: any) {
      console.error('[useAuth] ============ RESET PASSWORD ERROR ============')
      console.error('[useAuth] Error:', err.message)
      
      let errorMessage = 'Password reset failed'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      
      console.error('[useAuth] ============ END ERROR ============')
      
      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // UPDATE PASSWORD METHOD
  // ============================================================================
  const updatePassword = async (newPassword: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ UPDATE PASSWORD START ============')
      console.log('[useAuth] Updating password...')

      const response = await $fetch('/api/auth/update-password', {
        method: 'POST',
        body: { password: newPassword }
      })

      console.log('[useAuth] ✅ Password updated successfully')
      console.log('[useAuth] ============ UPDATE PASSWORD END ============')

      return {
        success: true,
        message: 'Password updated successfully!'
      }
    } catch (err: any) {
      console.error('[useAuth] ============ UPDATE PASSWORD ERROR ============')
      console.error('[useAuth] Error:', err.message)
      
      let errorMessage = 'Password update failed'

      if (err.data?.statusMessage) {
        errorMessage = err.data.statusMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      
      console.error('[useAuth] ============ END ERROR ============')
      
      error.value = errorMessage
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // ============================================================================
  // CLEAR ERROR METHOD
  // ============================================================================
  const clearError = () => {
    console.log('[useAuth] Clearing error')
    error.value = null
  }

  // ============================================================================
  // RETURN COMPOSABLE
  // ============================================================================
  return {
    // State
    loading,
    error,
    
    // Methods
    signup,
    login,
    logout,
    verifyEmail,
    resetPassword,
    updatePassword,
    clearError,
    
    // Store access
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    token: authStore.token
  }
}
