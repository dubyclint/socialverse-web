import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // SIGNUP METHOD
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
      console.log('[useAuth] Signup attempt:', {
        email: credentials.email,
        username: credentials.username
      })

      const response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: credentials
      })

      console.log('[useAuth] ✅ Signup successful:', response)

      if (response.user) {
        authStore.setUser(response.user)
        if (response.token) {
          authStore.setToken(response.token)
        }
      }

      return {
        success: true,
        message: response.message || 'Account created successfully!',
        user: response.user,
        needsConfirmation: response.needsConfirmation || true
      }
    } catch (err: any) {
      console.error('[useAuth] ✗ Signup failed:', err)
      
      const errorMessage = err.data?.statusMessage || 
                          err.message || 
                          'Signup failed. Please try again.'
      
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
  // LOGIN METHOD
  // ============================================================================
  const login = async (credentials: {
    email: string
    password: string
    rememberMe?: boolean
  }) => {
    loading.value = true
    error.value = null

    try {
      console.log('[useAuth] Login attempt:', credentials.email)

      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password
        }
      })

      console.log('[useAuth] ✅ Login successful')

      if (response.user) {
        authStore.setUser(response.user)
        if (response.token) {
          authStore.setToken(response.token)
        }
        if (credentials.rememberMe) {
          authStore.setRememberMe(true)
        }
      }

      return {
        success: true,
        message: 'Login successful!',
        user: response.user
      }
    } catch (err: any) {
      console.error('[useAuth] ✗ Login failed:', err)
      
      const errorMessage = err.data?.statusMessage || 
                          err.message || 
                          'Login failed. Please try again.'
      
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
      console.log('[useAuth] Logout attempt')

      await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      console.log('[useAuth] ✅ Logout successful')
      authStore.clearAuth()

      return {
        success: true,
        message: 'Logged out successfully'
      }
    } catch (err: any) {
      console.error('[useAuth] ✗ Logout failed:', err)
      
      // Clear auth anyway
      authStore.clearAuth()
      
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
      console.log('[useAuth] Verifying email...')

      const response = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: { token }
      })

      console.log('[useAuth] ✅ Email verified')

      return {
        success: true,
        message: 'Email verified successfully!'
      }
    } catch (err: any) {
      console.error('[useAuth] ✗ Email verification failed:', err)
      
      const errorMessage = err.data?.statusMessage || 
                          err.message || 
                          'Email verification failed'
      
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
      console.log('[useAuth] Requesting password reset for:', email)

      const response = await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { email }
      })

      console.log('[useAuth] ✅ Password reset email sent')

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.'
      }
    } catch (err: any) {
      console.error('[useAuth] ✗ Password reset failed:', err)
      
      const errorMessage = err.data?.statusMessage || 
                          err.message || 
                          'Password reset failed'
      
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
      console.log('[useAuth] Updating password...')

      const response = await $fetch('/api/auth/update-password', {
        method: 'POST',
        body: { password: newPassword }
      })

      console.log('[useAuth] ✅ Password updated')

      return {
        success: true,
        message: 'Password updated successfully!'
      }
    } catch (err: any) {
      console.error('[useAuth] ✗ Password update failed:', err)
      
      const errorMessage = err.data?.statusMessage || 
                          err.message || 
                          'Password update failed'
      
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
