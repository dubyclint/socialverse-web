// FILE: /composables/useAuth.ts - DIAGNOSTIC VERSION
// ============================================================================
// ENHANCED WITH COMPREHENSIVE ERROR LOGGING TO IDENTIFY ROOT CAUSE
// This version logs the complete error object structure for debugging

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
   * DIAGNOSTIC: Extract error message from $fetch error response
   * Logs complete error structure to identify root cause
   */
  const extractErrorMessage = (err: any): string => {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('[useAuth] DIAGNOSTIC: COMPLETE ERROR OBJECT')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('[useAuth] Full error object:', err)
    console.log('[useAuth] Error type:', typeof err)
    console.log('[useAuth] Error constructor:', err?.constructor?.name)
    console.log('[useAuth] Error keys:', Object.keys(err || {}))
    
    // Log all properties of the error object
    if (err) {
      console.log('[useAuth] Error properties:')
      for (const key in err) {
        try {
          console.log(`  - ${key}:`, err[key])
        } catch (e) {
          console.log(`  - ${key}: [Unable to log - circular reference or error]`)
        }
      }
    }

    console.log('───────────────────────────────────────────────────────────')
    console.log('[useAuth] CHECKING ERROR STRUCTURE PATHS')
    console.log('───────────────────────────────────────────────────────────')
    
    // Check err.data (where $fetch puts the response)
    console.log('[useAuth] err.data exists:', !!err?.data)
    if (err?.data) {
      console.log('[useAuth] err.data:', err.data)
      console.log('[useAuth] err.data type:', typeof err.data)
      console.log('[useAuth] err.data keys:', Object.keys(err.data || {}))
    }

    // Check err.statusCode
    console.log('[useAuth] err.statusCode:', err?.statusCode)
    
    // Check err.statusMessage
    console.log('[useAuth] err.statusMessage:', err?.statusMessage)
    
    // Check err.message
    console.log('[useAuth] err.message:', err?.message)
    
    // Check err.error
    console.log('[useAuth] err.error:', err?.error)
    
    // Check err.response
    console.log('[useAuth] err.response:', err?.response)
    
    // Check err._data (alternative location)
    console.log('[useAuth] err._data:', err?._data)

    console.log('───────────────────────────────────────────────────────────')
    console.log('[useAuth] ATTEMPTING ERROR MESSAGE EXTRACTION')
    console.log('───────────────────────────────────────────────────────────')
    
    // PROBLEM #2 FIX: Check err.data.message FIRST (where $fetch puts the response)
    if (err?.data) {
      console.log('[useAuth] ✓ Error has data property')
      
      // Check for message property (most common from our API)
      if (err.data.message && typeof err.data.message === 'string') {
        console.log('[useAuth] ✓ Found error message in data.message:', err.data.message)
        return err.data.message
      }
      
      // Check for statusMessage property
      if (err.data.statusMessage && typeof err.data.statusMessage === 'string') {
        console.log('[useAuth] ✓ Found error message in data.statusMessage:', err.data.statusMessage)
        return err.data.statusMessage
      }
      
      // Check for error property
      if (err.data.error) {
        if (typeof err.data.error === 'string') {
          console.log('[useAuth] ✓ Found error message in data.error:', err.data.error)
          return err.data.error
        }
        if (err.data.error.message && typeof err.data.error.message === 'string') {
          console.log('[useAuth] ✓ Found error message in data.error.message:', err.data.error.message)
          return err.data.error.message
        }
      }
    }

    // Fallback to standard error properties
    if (err?.statusMessage && typeof err.statusMessage === 'string') {
      console.log('[useAuth] ✓ Found error message in statusMessage:', err.statusMessage)
      return err.statusMessage
    }
    
    if (err?.message && typeof err.message === 'string') {
      console.log('[useAuth] ✓ Found error message in message:', err.message)
      return err.message
    }
    
    if (err?.error) {
      if (typeof err.error === 'string') {
        console.log('[useAuth] ✓ Found error message in error (string):', err.error)
        return err.error
      }
      if (err.error.message && typeof err.error.message === 'string') {
        console.log('[useAuth] ✓ Found error message in error.message:', err.error.message)
        return err.error.message
      }
    }

    // Final fallback
    console.log('[useAuth] ✗ No specific error message found, using fallback')
    console.log('═══════════════════════════════════════════════════════════')
    return 'An error occurred. Please try again.'
  }

  /**
   * Signup function with enhanced error logging
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
      let response
      try {
        response = await $fetch<any>('/api/auth/signup', {
          method: 'POST',
          body: { email, password, username },
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (fetchErr: any) {
        console.error('[useAuth] $fetch threw an error (expected for non-2xx status)')
        console.error('[useAuth] Caught fetch error:', fetchErr)
        throw fetchErr
      }

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
      
      // Use diagnostic function to extract error
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      
      console.error('[useAuth] Final extracted error message:', errorMessage)
      console.error('[useAuth] ========== END SIGNUP ERROR ==========')
      
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
      
      let response
      try {
        response = await $fetch<any>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } catch (fetchErr: any) {
        console.error('[useAuth] $fetch threw an error (expected for non-2xx status)')
        console.error('[useAuth] Caught fetch error:', fetchErr)
        throw fetchErr
      }

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
      
      const errorMessage = extractErrorMessage(err)
      error.value = errorMessage
      
      console.error('[useAuth] Final extracted error message:', errorMessage)
      console.error('[useAuth] ========== END LOGIN ERROR ==========')
      
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
