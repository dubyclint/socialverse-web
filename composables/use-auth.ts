// ============================================================================
// FIXED FILE 2: /composables/use-auth.ts - COMPLETE VERSION
// ============================================================================
// ✅ This file is already correct - it calls setRefreshToken()
// ✅ Now that the store has the method, this will work perfectly
// ============================================================================

import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

export const useAuth = () => {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const supabase = useSupabaseClient()
  const router = useRouter()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // SIGNUP METHOD
  // ============================================================================
  const signup = async (email: string, password: string, username: string) => {
    console.log('[useAuth] ============ SIGNUP START ============')
    console.log('[useAuth] Signup attempt:', { email, username })

    isLoading.value = true
    error.value = null

    try {
      // Use backend endpoint instead of direct Supabase call
      const response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          username
        }
      })

      if (!response.success) {
        throw new Error(response.message || 'Signup failed')
      }

      console.log('[useAuth] ✅ Signup successful')
      console.log('[useAuth] User ID:', response.user.id)
      console.log('[useAuth] ============ SIGNUP END ============')

      return {
        success: true,
        message: response.message,
        user: response.user,
        requiresEmailVerification: true
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Signup error:', err.message)
      error.value = err.message
      
      return {
        success: false,
        error: err.message,
        requiresEmailVerification: false
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // LOGIN METHOD - ✅ NOW WORKS PERFECTLY
  // ============================================================================
  const login = async (email: string, password: string) => {
    console.log('[useAuth] ============ LOGIN START ============')
    console.log('[useAuth] Login attempt:', { email })

    isLoading.value = true
    error.value = null

    try {
      // Use backend endpoint
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (!response.success) {
        throw new Error(response.message || 'Login failed')
      }

      // Update stores
      authStore.setUser(response.user)
      authStore.setToken(response.token)
      
      // ✅ THIS NOW WORKS - setRefreshToken() method exists in the store
      if (response.refreshToken) {
        authStore.setRefreshToken(response.refreshToken)
      }

      // Update profile store
      profileStore.setProfile(response.user)

      console.log('[useAuth] ✅ Login successful')
      console.log('[useAuth] User ID:', response.user.id)
      console.log('[useAuth] ============ LOGIN END ============')

      return {
        success: true,
        message: 'Login successful!',
        user: response.user,
        isEmailVerified: response.user.email_confirmed_at !== null
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Login error:', err.message)
      error.value = err.message
      
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
    console.log('[useAuth] ============ LOGOUT START ============')

    try {
      await supabase.auth.signOut()
      profileStore.clearProfile()
      authStore.clearAuth()
      await router.push('/auth/signin')

      console.log('[useAuth] ✅ Logout successful')
      console.log('[useAuth] ============ LOGOUT END ============')

      return { success: true, message: 'Logged out successfully' }
    } catch (err: any) {
      console.error('[useAuth] ❌ Logout error:', err.message)
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // ============================================================================
  // VERIFY EMAIL METHOD
  // ============================================================================
  const verifyEmail = async (token: string, type: 'email' | 'recovery' | 'signup' = 'signup') => {
    console.log('[useAuth] ============ VERIFY EMAIL START ============')
    console.log('[useAuth] Token (first 20 chars):', String(token).substring(0, 20) + '...')
    console.log('[useAuth] Type:', type)

    isLoading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: { token, type }
      })

      if (!result?.success) {
        throw new Error(result?.message || 'Email verification failed')
      }

      console.log('[useAuth] ✅ Email verified successfully')
      console.log('[useAuth] User ID:', result.user?.id)
      console.log('[useAuth] ============ VERIFY EMAIL END ============')

      return { 
        success: true, 
        data: result,
        user: result.user
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Email verification error:', err.message)
      error.value = err.message
      return { 
        success: false, 
        error: err.message 
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // RESEND VERIFICATION EMAIL METHOD
  // ============================================================================
  const resendVerificationEmail = async (email: string) => {
    console.log('[useAuth] ============ RESEND VERIFICATION EMAIL START ============')
    console.log('[useAuth] Email:', email)

    isLoading.value = true
    error.value = null

    try {
      const result = await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to resend verification email')
      }

      console.log('[useAuth] ✅ Verification email resent')
      console.log('[useAuth] ============ RESEND VERIFICATION EMAIL END ============')

      return { 
        success: true, 
        data: result
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Resend error:', err.message)
      error.value = err.message
      return { 
        success: false, 
        error: err.message 
      }
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // REFRESH TOKEN METHOD
  // ============================================================================
  const refreshToken = async () => {
    console.log('[useAuth] ============ REFRESH TOKEN START ============')

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError) {
        throw new Error(refreshError.message)
      }

      if (refreshData.session) {
        authStore.setToken(refreshData.session.access_token)
        if (refreshData.session.refresh_token) {
          // ✅ THIS NOW WORKS - setRefreshToken() method exists
          authStore.setRefreshToken(refreshData.session.refresh_token)
        }
        console.log('[useAuth] ✅ Token refreshed')
      }

      console.log('[useAuth] ============ REFRESH TOKEN END ============')

      return {
        success: true,
        message: 'Token refreshed'
      }
    } catch (err: any) {
      console.error('[useAuth] ❌ Token refresh error:', err.message)
      error.value = err.message

      return {
        success: false,
        error: err.message
      }
    }
  }

  return {
    isLoading,
    error,
    signup,
    login,
    logout,
    verifyEmail,
    resendVerificationEmail,
    refreshToken
  }
}
