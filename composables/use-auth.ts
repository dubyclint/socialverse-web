// ============================================================================
// FILE: /composables/use-auth.ts - COMPLETE ENHANCED VERSION
// ============================================================================
// PHASE 6 ENHANCEMENTS:
// ✅ Enhanced logout method with profile store clearing
// ✅ Complete localStorage/sessionStorage clearing
// ✅ Other stores clearing (notifications, messages, chat, user)
// ✅ Comprehensive logging and error handling
// ✅ All existing methods preserved and improved
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
  // LOGOUT METHOD - ✅ PHASE 6 ENHANCED VERSION
  // ============================================================================
  const logout = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] ============ LOGOUT START ============')
      console.log('[useAuth] Logout attempt')

      // ============================================================================
      // CALL LOGOUT API
      // ============================================================================
      console.log('[useAuth] Calling logout API...')
      
      try {
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
        console.log('[useAuth] ✅ Logout API call successful')
      } catch (apiError: any) {
        console.warn('[useAuth] ⚠️ Logout API error:', apiError.message)
        // Continue anyway - we'll still clear client-side data
      }

      // ============================================================================
      // CLEAR AUTH STORE
      // ============================================================================
      console.log('[useAuth] Clearing auth store...')
      authStore.clearAuth()
      console.log('[useAuth] ✅ Auth store cleared')

      // ============================================================================
      // CLEAR PROFILE STORE
      // ============================================================================
      console.log('[useAuth] Clearing profile store...')
      try {
        const profileStore = useProfileStore()
        profileStore.clearProfile()
        console.log('[useAuth] ✅ Profile store cleared')
      } catch (profileError: any) {
        console.warn('[useAuth] ⚠️ Profile store clearing error:', profileError.message)
      }

      // ============================================================================
      // CLEAR OTHER STORES (if they exist)
      // ============================================================================
      console.log('[useAuth] Clearing other stores...')
      
      try {
        // Clear notifications store
        const notificationsStore = useNotificationsStore?.()
        if (notificationsStore && typeof notificationsStore.clearNotifications === 'function') {
          notificationsStore.clearNotifications()
          console.log('[useAuth] ✅ Notifications store cleared')
        }
      } catch (err) {
        console.warn('[useAuth] ⚠️ Notifications store not available')
      }

      try {
        // Clear messages store
        const messagesStore = useMessagesStore?.()
        if (messagesStore && typeof messagesStore.clearMessages === 'function') {
          messagesStore.clearMessages()
          console.log('[useAuth] ✅ Messages store cleared')
        }
      } catch (err) {
        console.warn('[useAuth] ⚠️ Messages store not available')
      }

      try {
        // Clear chat store
        const chatStore = useChatStore?.()
        if (chatStore && typeof chatStore.clearChat === 'function') {
          chatStore.clearChat()
          console.log('[useAuth] ✅ Chat store cleared')
        }
      } catch (err) {
        console.warn('[useAuth] ⚠️ Chat store not available')
      }

      try {
        // Clear user store
        const userStore = useUserStore?.()
        if (userStore && typeof userStore.clearUser === 'function') {
          userStore.clearUser()
          console.log('[useAuth] ✅ User store cleared')
        }
      } catch (err) {
        console.warn('[useAuth] ⚠️ User store not available')
      }

      // ============================================================================
      // CLEAR ALL LOCALSTORAGE DATA
      // ============================================================================
      console.log('[useAuth] Clearing all localStorage data...')
      
      if (process.client) {
        try {
          // Get all localStorage keys
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key) {
              keysToRemove.push(key)
            }
          }

          console.log('[useAuth] Found', keysToRemove.length, 'localStorage keys to remove')

          // Remove all keys
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key)
              console.log('[useAuth] ✅ Removed localStorage key:', key)
            } catch (err) {
              console.warn('[useAuth] ⚠️ Failed to remove localStorage key:', key)
            }
          })

          console.log('[useAuth] ✅ All localStorage data cleared')
        } catch (storageError: any) {
          console.error('[useAuth] ❌ localStorage clearing error:', storageError.message)
        }
      }

      // ============================================================================
      // CLEAR ALL SESSIONSTORAGE DATA
      // ============================================================================
      console.log('[useAuth] Clearing all sessionStorage data...')
      
      if (process.client) {
        try {
          // Get all sessionStorage keys
          const keysToRemove = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i)
            if (key) {
              keysToRemove.push(key)
            }
          }

          console.log('[useAuth] Found', keysToRemove.length, 'sessionStorage keys to remove')

          // Remove all keys
          keysToRemove.forEach(key => {
            try {
              sessionStorage.removeItem(key)
              console.log('[useAuth] ✅ Removed sessionStorage key:', key)
            } catch (err) {
              console.warn('[useAuth] ⚠️ Failed to remove sessionStorage key:', key)
            }
          })

          console.log('[useAuth] ✅ All sessionStorage data cleared')
        } catch (storageError: any) {
          console.error('[useAuth] ❌ sessionStorage clearing error:', storageError.message)
        }
      }

      // ============================================================================
      // CLEAR COOKIES (if needed)
      // ============================================================================
      console.log('[useAuth] Clearing auth cookies...')
      
      try {
        // Clear auth token cookie
        useCookie('auth_token').value = null
        console.log('[useAuth] ✅ Auth token cookie cleared')

        // Clear refresh token cookie
        useCookie('auth_refresh_token').value = null
        console.log('[useAuth] ✅ Refresh token cookie cleared')

        // Clear user cookie
        useCookie('auth_user').value = null
        console.log('[useAuth] ✅ User cookie cleared')
      } catch (cookieError: any) {
        console.warn('[useAuth] ⚠️ Cookie clearing error:', cookieError.message)
      }

      // ============================================================================
      // REDIRECT TO LOGIN
      // ============================================================================
      console.log('[useAuth] Redirecting to login page...')
      
      try {
        await navigateTo('/login')
        console.log('[useAuth] ✅ Redirected to login')
      } catch (navError: any) {
        console.warn('[useAuth] ⚠️ Navigation error:', navError.message)
        // Fallback: reload page
        if (process.client) {
          window.location.href = '/login'
        }
      }

      console.log('[useAuth] ✅ Logout completed successfully')
      console.log('[useAuth] ============ LOGOUT END ============')

      return {
        success: true,
        message: 'Logged out successfully'
      }

    } catch (err: any) {
      console.error('[useAuth] ============ LOGOUT ERROR ============')
      console.error('[useAuth] Error type:', err.constructor.name)
      console.error('[useAuth] Error message:', err.message)
      console.error('[useAuth] Error stack:', err.stack)
      console.error('[useAuth] ============ END ERROR ============')

      // Clear auth anyway even if error occurs
      console.log('[useAuth] Clearing auth store despite error...')
      try {
        authStore.clearAuth()
        console.log('[useAuth] ✅ Auth store cleared despite error')
      } catch (clearError) {
        console.error('[useAuth] ❌ Failed to clear auth store:', clearError)
      }

      // Try to redirect to login anyway
      try {
        await navigateTo('/login')
      } catch (navError) {
        if (process.client) {
          window.location.href = '/login'
        }
      }

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
