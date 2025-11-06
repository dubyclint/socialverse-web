// FILE: /composables/useAuth.ts - FIXED VERSION
// ============================================================================
// ERROR #1 FIX: Proper error message extraction from $fetch responses

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
   * ERROR #1 FIX: Extract error message from $fetch response
   * $fetch wraps error responses in err.data object
   * Must check err.data.message FIRST (where API error is)
   */
  const extractErrorMessage = (err: any): string => {
    console.log('[useAuth] Extracting error from:', err)
    
    // ✅ FIX: Check err.data.message FIRST (this is where $fetch puts the response)
    if (err?.data) {
      console.log('[useAuth] Error has data property:', err.data)
      
      // Check for message property (most common)
      if (err.data.message) {
        console.log('[useAuth] Found error message in data.message:', err.data.message)
        return err.data.message
      }
      
      // Check for statusMessage property
      if (err.data.statusMessage) {
        console.log('[useAuth] Found error message in data.statusMessage:', err.data.statusMessage)
        return err.data.statusMessage
      }
      
      // Check for error property
      if (err.data.error) {
        console.log('[useAuth] Found error message in data.error:', err.data.error)
        return err.data.error
      }
    }

    // Fallback to standard error properties
    if (err?.statusMessage) {
      console.log('[useAuth] Found error message in statusMessage:', err.statusMessage)
      return err.statusMessage
    }
    
    if (err?.message) {
      console.log('[useAuth] Found error message in message:', err.message)
      return err.message
    }
    
    if (err?.error) {
      if (typeof err.error === 'string') {
        console.log('[useAuth] Found error message in error (string):', err.error)
        return err.error
      }
      if (err.error.message) {
        console.log('[useAuth] Found error message in error.message:', err.error.message)
        return err.error.message
      }
    }

    // Final fallback
    console.log('[useAuth] No specific error message found, using fallback')
    return 'An error occurred'
  }

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
      
      // Make API call
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
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      console.error('[useAuth] ========== SIGNUP ERROR ==========')
      console.error('[useAuth] Full error object:', err)
      console.error('[useAuth] Error type:', typeof err)
      console.error('[useAuth] Error constructor:', err?.constructor?.name)
      
      // Extract the real error message using fixed function
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      
      console.error('[useAuth] Final error message:', errorMessage)
      
      return {
        success: false,
        message: errorMessage  // ✅ Return message, not error
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
        message: errorMessage  // ✅ Return message, not error
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
