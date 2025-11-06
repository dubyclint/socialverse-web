// FILE: /composables/useAuth.ts - COMPLETE FIX
// ============================================================================
// FIXES ALL 6 PROBLEMS:
// 1. Generic "Signup failed" message - now uses proper error extraction
// 2. Error type object - properly handles $fetch error structure
// 3. Error constructor - correctly identifies error types
// 4. Error extraction - complete fallback chain with better handling
// 5. SYNTAX ERROR - Fixed incomplete throw statement (was "errorMs", now "errorMsg")
// 6. $fetch throws on non-2xx - Now uses try-catch properly to handle $fetch errors

import { ref, computed } from 'vue'

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!authStore.token)
  const user = computed(() => authStore.user)
  const token = computed(() => authStore.token)

  /**
   * PROBLEM #2, #3, #4, #6 FIX: Extract error message from $fetch error response
   * $fetch throws errors on non-2xx status codes with structure:
   * {
   *   data: { success: false, message: 'Actual error' },
   *   statusCode: 400,
   *   statusMessage: 'Bad Request',
   *   ...
   * }
   * This function extracts the most specific error message available.
   */
  const extractErrorMessage = (err: any): string => {
    console.log('[useAuth] Extracting error from:', err)
    console.log('[useAuth] Error type:', typeof err)
    console.log('[useAuth] Error constructor:', err?.constructor?.name)
    
    // PROBLEM #2 FIX: Check err.data.message FIRST (where $fetch puts the response)
    if (err?.data) {
      console.log('[useAuth] Error has data property:', err.data)
      
      // Check for message property (most common from our API)
      if (err.data.message && typeof err.data.message === 'string') {
        console.log('[useAuth] Found error message in data.message:', err.data.message)
        return err.data.message
      }
      
      // Check for statusMessage property
      if (err.data.statusMessage && typeof err.data.statusMessage === 'string') {
        console.log('[useAuth] Found error message in data.statusMessage:', err.data.statusMessage)
        return err.data.statusMessage
      }
      
      // Check for error property
      if (err.data.error) {
        if (typeof err.data.error === 'string') {
          console.log('[useAuth] Found error message in data.error:', err.data.error)
          return err.data.error
        }
        if (err.data.error.message && typeof err.data.error.message === 'string') {
          console.log('[useAuth] Found error message in data.error.message:', err.data.error.message)
          return err.data.error.message
        }
      }
    }

    // PROBLEM #4 FIX: Fallback to standard error properties
    if (err?.statusMessage && typeof err.statusMessage === 'string') {
      console.log('[useAuth] Found error message in statusMessage:', err.statusMessage)
      return err.statusMessage
    }
    
    if (err?.message && typeof err.message === 'string') {
      console.log('[useAuth] Found error message in message:', err.message)
      return err.message
    }
    
    if (err?.error) {
      if (typeof err.error === 'string') {
        console.log('[useAuth] Found error message in error (string):', err.error)
        return err.error
      }
      if (err.error.message && typeof err.error.message === 'string') {
        console.log('[useAuth] Found error message in error.message:', err.error.message)
        return err.error.message
      }
    }

    // Final fallback - should rarely reach here
    console.log('[useAuth] No specific error message found, using fallback')
    return 'An error occurred. Please try again.'
  }

  /**
   * PROBLEM #6 FIX: Signup now properly handles $fetch errors
   * $fetch throws on non-2xx status codes, so we catch those errors
   * and extract the message from the error.data object
   */
  const signup = async (email: string, password: string, username: string) => {
    try {
      loading.value = true
      error.value = ''

      console.log('[useAuth] ========== SIGNUP START ==========')
      console.log('[useAuth] Signup attempt:', { email, username })

      // Validate inputs
      if (!email || !password || !username) {
        throw new Error('Email, password, and username are required')
      }

      console.log('[useAuth] Calling /api/auth/signup endpoint...')
      
      // PROBLEM #6 FIX: $fetch will throw on non-2xx status codes
      // The response will be in err.data when caught
      const response = await $fetch<any>('/api/auth/signup', {
        method: 'POST',
        body: { email, password, username },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('[useAuth] Signup response received:', response)

      if (!response) {
        throw new Error('No response from server')
      }

      // Check if response indicates success
      if (response.success === true) {
        console.log('[useAuth] ========== SIGNUP SUCCESS ==========')
        console.log('[useAuth] User created:', { userId: response.user?.id, email })
        
        return {
          success: true,
          message: response.message || 'Account created successfully',
          nextStep: response.nextStep || 'email_verification',
          userId: response.user?.id
        }
      } else {
        // Response indicates failure - throw error with real message
        const errorMsg = response.message || 'Signup failed'
        console.error('[useAuth] Signup failed with message:', errorMsg)
        // PROBLEM #5 FIX: Was "throw new Error(err" - now correctly "throw new Error(errorMsg)"
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      console.error('[useAuth] ========== SIGNUP ERROR ==========')
      console.error('[useAuth] Full error object:', err)
      
      // PROBLEM #2, #3, #4 FIX: Use extractErrorMessage to get proper error text
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      
      console.error('[useAuth] Final error message:', errorMessage)
      
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      loading.value = true
      error.value = ''

      console.log('[useAuth] ========== LOGIN START ==========')
      console.log('[useAuth] Login attempt:', { email })

      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      console.log('[useAuth] Calling /api/auth/login endpoint...')
      
      const response = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('[useAuth] Login response received:', response)

      if (!response) {
        throw new Error('No response from server')
      }

      if (response.success === true) {
        console.log('[useAuth] ========== LOGIN SUCCESS ==========')
        
        // Store token and user
        authStore.setToken(response.token)
        authStore.setUser(response.user)
        
        // Store in localStorage
        if (process.client) {
          localStorage.setItem('auth_token', response.token)
          localStorage.setItem('auth_user', JSON.stringify(response.user))
        }
        
        console.log('[useAuth] Token and user stored')
        
        return {
          success: true,
          message: 'Login successful',
          user: response.user,
          token: response.token
        }
      } else {
        const errorMsg = response.message || 'Login failed'
        console.error('[useAuth] Login failed with message:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      console.error('[useAuth] ========== LOGIN ERROR ==========')
      console.error('[useAuth] Full error:', err)
      
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      
      console.error('[useAuth] Final error message:', errorMessage)
      
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      console.log('[useAuth] Logout initiated')
      
      authStore.clearAuth()
      
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
      
      await router.push('/login')
      console.log('[useAuth] Logout successful')
      
      return { success: true }
    } catch (err: any) {
      console.error('[useAuth] Logout error:', err)
      return { success: false, message: 'Logout failed' }
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
    signup,
    login,
    logout,
    extractErrorMessage
  }
}
