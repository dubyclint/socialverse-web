// FILE: /composables/use-auth.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ FIXED: Proper token management, user storage, and error handling
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
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Signup user
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
      }

      console.log('[useAuth] ✅ Logout successful')
      return { success: true }

    } catch (err: any) {
      console.error('[useAuth] Logout error:', err)
      // Clear anyway
      authStore.clearAuth()
      userStore.clearSession()
      return { success: true }
    }
  }

  /**
   * Check if user is authenticated
   */
  const checkAuth = () => {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('auth_token')
    return !!token
  }

  /**
   * Initialize auth from stored token
   */
  const initializeAuth = async () => {
    try {
      if (typeof window === 'undefined') return
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('[useAuth] No stored token found')
        return
      }

      console.log('[useAuth] Initializing auth from stored token')
      authStore.setToken(token)
      
      // Initialize user session
      await userStore.initializeSession()
      
      console.log('[useAuth] ✅ Auth initialized')
    } catch (err) {
      console.error('[useAuth] Auth initialization failed:', err)
      authStore.clearAuth()
    }
  }

  return {
    // State
    loading,
    error,
    
    // Computed
    isAuthenticated,
    user,
    token,
    
    // Methods
    login,
    signup,
    logout,
    checkAuth,
    initializeAuth
  }
}
