// ============================================================================
// FILE: /composables/use-auth-with-error-catcher.ts - FIXED VERSION
// ============================================================================
// CLEAR ERRORS AT START OF EACH SIGNUP ATTEMPT
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
  // SIGNUP METHOD WITH ERROR CATCHING
  // ============================================================================
  const signup = async (email: string, password: string, username: string) => {
    console.log('[useAuthWithErrorCatcher] ============ SIGNUP START ============')
    console.log('[useAuthWithErrorCatcher] Signup attempt:', { email, username })

    // ✅ CLEAR PREVIOUS ERRORS AT START OF NEW SIGNUP ATTEMPT
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
        response = await $fetch('/api/auth/signup', {
          method: 'POST',
          body: {
            email: email.trim().toLowerCase(),
            password,
            username: username.trim().toLowerCase()
          }
        })
      } catch (apiError: any) {
        console.error('[useAuthWithErrorCatcher] API request failed:', apiError)

        captureError('API_REQUEST', apiError, {
          endpoint: '/api/auth/signup',
          method: 'POST',
          statusCode: apiError?.statusCode,
          statusMessage: apiError?.statusMessage,
          data: apiError?.data
        })

        throw apiError
      }

      console.log('[useAuthWithErrorCatcher] ✅ API request successful')

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
      // PHASE 4: STORE UPDATE
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] PHASE 4: Updating stores')

      try {
        authStore.setUser(response.user)
        authStore.setUserId(response.user.id)
        profileStore.setProfile(response.user)
      } catch (storeError: any) {
        captureError('STORE_UPDATE', storeError, {
          user: response.user
        })
        throw storeError
      }

      console.log('[useAuthWithErrorCatcher] ✅ Stores updated successfully')

      // ============================================================================
      // PHASE 5: SUCCESS
      // ============================================================================
      console.log('[useAuthWithErrorCatcher] ✅ Signup completed successfully')
      console.log('[useAuthWithErrorCatcher] ============ SIGNUP END ============')

      return {
        success: true,
        message: response.message,
        user: response.user,
        requiresEmailVerification: true
      }

    } catch (err: any) {
      console.error('[useAuthWithErrorCatcher] ❌ Signup error:', err.message)
      console.error('[useAuthWithErrorCatcher] Error details:', err)

      // Capture uncaught errors
      if (!err.phase) {
        captureError('UNCAUGHT_ERROR', err, {
          email,
          username
        })
      }

      error.value = err.message || 'Signup failed'

      // ✅ ONLY PRINT CURRENT ERROR (not accumulated)
      console.log('[useAuthWithErrorCatcher] Current error report:')
      printReport()

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
  // LOGIN METHOD WITH ERROR CATCHING
  // ============================================================================
  const login = async (email: string, password: string) => {
    console.log('[useAuthWithErrorCatcher] ============ LOGIN START ============')
    console.log('[useAuthWithErrorCatcher] Login attempt:', { email })

    // ✅ CLEAR PREVIOUS ERRORS AT START OF NEW LOGIN ATTEMPT
    clearErrors()

    isLoading.value = true
    error.value = null

    try {
      // Client-side validation
      if (!email || !password) {
        const validationError = new Error('Email and password are required')
        captureError('LOGIN_VALIDATION', validationError)
        throw validationError
      }

      // API request
      let response
      try {
        response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: { email, password }
        })
      } catch (apiError: any) {
        captureError('LOGIN_API_REQUEST', apiError, {
          endpoint: '/api/auth/login',
          statusCode: apiError?.statusCode
        })
        throw apiError
      }

      if (!response?.success) {
        const responseError = new Error(response?.message || 'Login failed')
        captureError('LOGIN_RESPONSE', responseError, { response })
        throw responseError
      }

      // Update stores
      authStore.setUser(response.user)
      authStore.setToken(response.token)
      if (response.refreshToken) {
        authStore.setRefreshToken(response.refreshToken)
      }
      profileStore.setProfile(response.user)

      console.log('[useAuthWithErrorCatcher] ✅ Login successful')
      console.log('[useAuthWithErrorCatcher] ============ LOGIN END ============')

      return {
        success: true,
        message: 'Login successful!',
        user: response.user,
        isEmailVerified: response.user.email_confirmed_at !== null
      }

    } catch (err: any) {
      console.error('[useAuthWithErrorCatcher] ❌ Login error:', err.message)
      captureError('LOGIN_ERROR', err)
      error.value = err.message
      printReport()

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
      await supabase.auth.signOut()
      profileStore.clearProfile()
      authStore.clearAuth()
      await router.push('/auth/signin')

      console.log('[useAuthWithErrorCatcher] ✅ Logout successful')
      console.log('[useAuthWithErrorCatcher] ============ LOGOUT END ============')

      return { success: true, message: 'Logged out successfully' }

    } catch (err: any) {
      console.error('[useAuthWithErrorCatcher] ❌ Logout error:', err.message)
      captureError('LOGOUT_ERROR', err)
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

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
