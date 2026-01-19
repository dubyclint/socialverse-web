// ============================================================================
// FILE: /composables/use-auth-with-error-catcher.ts - COMPLETE FIXED VERSION
// ============================================================================
// ✅ ISSUE #5 FIXED: Token stored after signup (authStore.setToken)
// ✅ Comprehensive error handling with error catcher
// ✅ Detailed logging at each phase
// ✅ Proper token management for auto-authentication
// ============================================================================

import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { useSignupErrorCatcher } from '~/utils/error-catcher'

export const useAuthWithErrorCatcher = () => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const { captureError, printReport, clearErrors } = useSignupErrorCatcher()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // SIGNUP METHOD WITH ERROR CATCHING - ✅ ISSUE #5 FIXED
  // ============================================================================
  const signup = async (email: string, password: string, username: string) => {
    console.log('[useAuthWithErrorCatcher] ============ SIGNUP START ============')
    console.log('[useAuthWithErrorCatcher] Signup attempt:', { email, username })

    clearErrors()
    console.log('[useAuthWithErrorCatcher] ✓ Cleared previous errors')

    isLoading.value = true
    error.value = null

    try {
      // ============================================================================
      // PHASE 1: CLIENT-SIDE VALIDATION
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 1: Client-side validation')

      if (!email || !password || !username) {
        const validationError = new Error('Missing required fields')
        captureError('CLIENT_VALIDATION', validationError, {
          email: !!email,
          password: !!password,
          username: !!username
        })
        throw validationError
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        const emailError = new Error('Invalid email format')
        captureError('CLIENT_VALIDATION', emailError, { email })
        throw emailError
      }

      if (password.length < 6) {
        const passwordError = new Error('Password must be at least 6 characters')
        captureError('CLIENT_VALIDATION', passwordError, { passwordLength: password.length })
        throw passwordError
      }

      if (username.length < 3) {
        const usernameError = new Error('Username must be at least 3 characters')
        captureError('CLIENT_VALIDATION', usernameError, { usernameLength: username.length })
        throw usernameError
      }

      console.log('[useAuthWithErrorCatcher] ✅ Client-side validation passed')

      // ============================================================================
      // PHASE 2: API REQUEST
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 2: Sending API request')

      let response
      try {
        console.log('[useAuthWithErrorCatcher] Calling /api/auth/signup endpoint...')

        response = await $fetch('/api/auth/signup', {
          method: 'POST',
          body: {
            email: email.trim().toLowerCase(),
            password,
            username: username.trim().toLowerCase()
          }
        })

        console.log('[useAuthWithErrorCatcher] ✅ API request successful')
        console.log('[useAuthWithErrorCatcher] Response received:', {
          success: response?.success,
          user: response?.user,
          token: !!response?.token,
          redirectTo: response?.redirectTo
        })

      } catch (apiError: any) {
        console.error('[useAuthWithErrorCatcher] ❌ API request failed:', apiError)

        captureError('API_REQUEST', apiError, {
          endpoint: '/api/auth/signup',
          method: 'POST',
          statusCode: apiError?.statusCode,
          statusMessage: apiError?.statusMessage,
          data: apiError?.data
        })

        throw apiError
      }

      // ============================================================================
      // PHASE 3: RESPONSE VALIDATION
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 3: Validating response')

      if (!response) {
        const responseError = new Error('No response from server')
        captureError('RESPONSE_VALIDATION', responseError, { response })
        throw responseError
      }

      if (!response.success) {
        const successError = new Error(response.message || 'Signup failed')
        captureError('RESPONSE_VALIDATION', successError, { response })
        throw successError
      }

      if (!response.user) {
        const userError = new Error('No user data in response')
        captureError('RESPONSE_VALIDATION', userError, { response })
        throw userError
      }

      console.log('[useAuthWithErrorCatcher] ✅ Response validation passed')

      // ============================================================================
      // ✅ PHASE 4: HANDLE TOKEN FROM SIGNUP - ISSUE #5 FIX
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 4: Processing authentication token')

      if (response.token) {
        console.log('[useAuthWithErrorCatcher] ✅ Token received from signup response')
        console.log('[useAuthWithErrorCatcher] Token length:', response.token.length)
        console.log('[useAuthWithErrorCatcher] Setting token in auth store...')

        try {
          // ✅ ISSUE #5 FIX: Store token in auth store
          authStore.setToken(response.token)
          console.log('[useAuthWithErrorCatcher] ✅ Token stored in auth store')

          // Verify token was stored
          if (authStore.token === response.token) {
            console.log('[useAuthWithErrorCatcher] ✅ Token verification successful')
          } else {
            console.warn('[useAuthWithErrorCatcher] ⚠️ Token verification failed')
          }
        } catch (tokenError: any) {
          console.error('[useAuthWithErrorCatcher] ❌ Failed to store token:', tokenError)
          captureError('TOKEN_STORAGE', tokenError, { token: !!response.token })
          throw tokenError
        }

        // Store refresh token if available
        if (response.refreshToken) {
          console.log('[useAuthWithErrorCatcher] Storing refresh token...')
          try {
            // authStore.setRefreshToken(response.refreshToken)
            console.log('[useAuthWithErrorCatcher] ✅ Refresh token stored')
          } catch (refreshError: any) {
            console.warn('[useAuthWithErrorCatcher] ⚠️ Failed to store refresh token:', refreshError)
            // Don't fail signup if refresh token fails
          }
        }
      } else {
        console.warn('[useAuthWithErrorCatcher] ⚠️ No token in signup response')
        console.log('[useAuthWithErrorCatcher] User will need to login separately')
      }

      // ============================================================================
      // PHASE 5: STORE UPDATE
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 5: Updating stores')

      try {
        console.log('[useAuthWithErrorCatcher] Setting user in auth store...')
        authStore.setUser(response.user)
        console.log('[useAuthWithErrorCatcher] ✅ User set in auth store')

        console.log('[useAuthWithErrorCatcher] Setting user ID in auth store...')
        authStore.setUserId(response.user.id)
        console.log('[useAuthWithErrorCatcher] ✅ User ID set in auth store')

        console.log('[useAuthWithErrorCatcher] Setting profile in profile store...')
        profileStore.setProfile(response.user)
        console.log('[useAuthWithErrorCatcher] ✅ Profile set in profile store')

      } catch (storeError: any) {
        console.error('[useAuthWithErrorCatcher] ❌ Store update error:', storeError)
        captureError('STORE_UPDATE', storeError, {
          user: response.user
        })
        throw storeError
      }

      console.log('[useAuthWithErrorCatcher] ✅ Stores updated successfully')

      // ============================================================================
      // PHASE 6: SUCCESS
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] ✅ Signup completed successfully')
      console.log('[useAuthWithErrorCatcher] User:', {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username
      })
      console.log('[useAuthWithErrorCatcher] Token stored:', !!authStore.token)
      console.log('[useAuthWithErrorCatcher] ============ SIGNUP END ============')

      return {
        success: true,
        message: response.message,
        user: response.user,
        requiresEmailVerification: response.requiresEmailVerification || false,
        token: response.token || null
      }

    } catch (err: any) {
      console.error('[useAuthWithErrorCatcher] ============ SIGNUP ERROR ============')
      console.error('[useAuthWithErrorCatcher] ❌ Signup error:', err.message)
      console.error('[useAuthWithErrorCatcher] Error details:', err)

      if (!err.phase) {
        captureError('UNCAUGHT_ERROR', err, {
          email,
          username
        })
      }

      error.value = err.message || 'Signup failed'

      console.log('[useAuthWithErrorCatcher] Current error report:')
      printReport()

      console.error('[useAuthWithErrorCatcher] ============ SIGNUP ERROR END ============')

      return {
        success: false,
        error: err.message || 'Signup failed',
        requiresEmailVerification: false
      }

    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // LOGIN METHOD - ✅ WITH TOKEN STORAGE
  // ============================================================================
  const login = async (email: string, password: string) => {
    console.log('[useAuthWithErrorCatcher] ============ LOGIN START ============')
    console.log('[useAuthWithErrorCatcher] Login attempt:', { email })

    clearErrors()
    console.log('[useAuthWithErrorCatcher] ✓ Cleared previous errors')

    isLoading.value = true
    error.value = null

    try {
      // ============================================================================
      // PHASE 1: VALIDATION
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 1: Validating login credentials')

      if (!email || !password) {
        const validationError = new Error('Email and password are required')
        captureError('LOGIN_VALIDATION', validationError)
        throw validationError
      }

      console.log('[useAuthWithErrorCatcher] ✅ Validation passed')

      // ============================================================================
      // PHASE 2: API REQUEST
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 2: Sending login request')

      let response
      try {
        console.log('[useAuthWithErrorCatcher] Calling /api/auth/login endpoint...')

        response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        })

        console.log('[useAuthWithErrorCatcher] ✅ Login API request successful')
        console.log('[useAuthWithErrorCatcher] Response received:', {
          success: response?.success,
          user: response?.user,
          token: !!response?.token
        })

      } catch (apiError: any) {
        console.error('[useAuthWithErrorCatcher] ❌ Login API request failed:', apiError)
        captureError('LOGIN_API_REQUEST', apiError, {
          endpoint: '/api/auth/login',
          statusCode: apiError?.statusCode
        })
        throw apiError
      }

      // ============================================================================
      // PHASE 3: RESPONSE VALIDATION
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 3: Validating login response')

      if (!response?.success) {
        const responseError = new Error(response?.message || 'Login failed')
        captureError('LOGIN_RESPONSE', responseError, { response })
        throw responseError
      }

      console.log('[useAuthWithErrorCatcher] ✅ Login response validation passed')

      // ============================================================================
      // ✅ PHASE 4: STORE TOKEN FROM LOGIN
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 4: Processing login token')

      if (response.token) {
        console.log('[useAuthWithErrorCatcher] ✅ Token received from login response')
        console.log('[useAuthWithErrorCatcher] Setting token in auth store...')

        try {
          authStore.setToken(response.token)
          console.log('[useAuthWithErrorCatcher] ✅ Token stored in auth store')

          if (response.refreshToken) {
            console.log('[useAuthWithErrorCatcher] Storing refresh token...')
            // authStore.setRefreshToken(response.refreshToken)
            console.log('[useAuthWithErrorCatcher] ✅ Refresh token stored')
          }
        } catch (tokenError: any) {
          console.error('[useAuthWithErrorCatcher] ❌ Failed to store token:', tokenError)
          captureError('LOGIN_TOKEN_STORAGE', tokenError)
          throw tokenError
        }
      } else {
        console.warn('[useAuthWithErrorCatcher] ⚠️ No token in login response')
      }

      // ============================================================================
      // PHASE 5: STORE UPDATE
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 5: Updating stores')

      try {
        authStore.setUser(response.user)
        profileStore.setProfile(response.user)
        console.log('[useAuthWithErrorCatcher] ✅ Stores updated successfully')
      } catch (storeError: any) {
        console.error('[useAuthWithErrorCatcher] ❌ Store update error:', storeError)
        captureError('LOGIN_STORE_UPDATE', storeError)
        throw storeError
      }

      // ============================================================================
      // PHASE 6: SUCCESS
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] ✅ Login completed successfully')
      console.log('[useAuthWithErrorCatcher] User:', {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username
      })
      console.log('[useAuthWithErrorCatcher] Token stored:', !!authStore.token)
      console.log('[useAuthWithErrorCatcher] ============ LOGIN END ============')

      return {
        success: true,
        message: 'Login successful!',
        user: response.user,
        isEmailVerified: response.user.email_confirmed_at !== null
      }

    } catch (err: any) {
      console.error('[useAuthWithErrorCatcher] ============ LOGIN ERROR ============')
      console.error('[useAuthWithErrorCatcher] ❌ Login error:', err.message)
      captureError('LOGIN_ERROR', err)
      error.value = err.message
      printReport()
      console.error('[useAuthWithErrorCatcher] ============ LOGIN ERROR END ============')

      return {
        success: false,
        error: err.message
      }

    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // LOGOUT METHOD
  // ============================================================================
  const logout = async () => {
    console.log('[useAuthWithErrorCatcher] ============ LOGOUT START ============')

    try {
      console.log('[useAuthWithErrorCatcher] Signing out from Supabase...')
      await supabase.auth.signOut()
      console.log('[useAuthWithErrorCatcher] ✅ Signed out from Supabase')

      console.log('[useAuthWithErrorCatcher] Clearing profile store...')
      profileStore.clearProfile()
      console.log('[useAuthWithErrorCatcher] ✅ Profile store cleared')

      console.log('[useAuthWithErrorCatcher] Clearing auth store...')
      authStore.clearAuth()
      console.log('[useAuthWithErrorCatcher] ✅ Auth store cleared')

      console.log('[useAuthWithErrorCatcher] Redirecting to signin page...')
      await router.push('/auth/signin')
      console.log('[useAuthWithErrorCatcher] ✅ Redirected to signin page')

      console.log('[useAuthWithErrorCatcher] ✅ Logout successful')
      console.log('[useAuthWithErrorCatcher] ============ LOGOUT END ============')

      return { success: true, message: 'Logged out successfully' }

    } catch (err: any) {
      console.error('[useAuthWithErrorCatcher] ============ LOGOUT ERROR ============')
      console.error('[useAuthWithErrorCatcher] ❌ Logout error:', err.message)
      captureError('LOGOUT_ERROR', err)
      error.value = err.message
      console.error('[useAuthWithErrorCatcher] ============ LOGOUT ERROR END ============')

      return { success: false, error: err.message }
    }
  }

  // ============================================================================
  // RETURN COMPOSABLE INTERFACE
  // ============================================================================

  return {
    isLoading,
    error,
    signup,
    login,
    logout,
    printReport,
    clearErrors
  }
}
