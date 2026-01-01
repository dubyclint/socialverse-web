// ============================================================================
// FILE: /composables/use-email-verification.ts - EMAIL VERIFICATION COMPOSABLE
// ============================================================================
// This composable handles email verification logic
// ✅ FIXED: Properly handles Supabase token formats
// ============================================================================

import { ref, computed } from 'vue'

export const useEmailVerification = () => {
  const loading = ref(false)
  const error = ref('')
  const success = ref('')

  /**
   * Extract error message from response
   */
  const extractErrorMessage = (err: any): string => {
    if (err.data?.statusMessage) {
      return err.data.statusMessage
    }
    if (err.statusMessage) {
      return err.statusMessage
    }
    if (err.data?.message) {
      return err.data.message
    }
    if (err.message) {
      return err.message
    }
    if (typeof err === 'string') {
      return err
    }
    return 'An error occurred'
  }

  /**
   * Verify email with token from URL
   * ✅ FIX: Properly handle Supabase token formats
   */
  const verifyEmail = async (token: string, type: 'email' | 'recovery' | 'signup' = 'signup') => {
    loading.value = true
    error.value = ''
    success.value = ''

    try {
      console.log('[useEmailVerification] ============ VERIFY EMAIL START ============')
      console.log('[useEmailVerification] Verifying email with token...')
      console.log('[useEmailVerification] Token (first 20 chars):', token.substring(0, 20) + '...')
      console.log('[useEmailVerification] Type:', type)

      if (!token) {
        throw new Error('Verification token is required')
      }

      // ✅ Send token to backend for verification
      console.log('[useEmailVerification] Sending verification request to API...')
      
      const result = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: {
          token,
          type
        }
      })

      console.log('[useEmailVerification] Verification response received:', {
        success: result?.success,
        message: result?.message,
        userId: result?.user?.id
      })

      if (!result?.success) {
        throw new Error(result?.message || 'Email verification failed')
      }

      success.value = result.message || 'Email verified successfully!'
      console.log('[useEmailVerification] ✅ Email verified successfully')
      console.log('[useEmailVerification] ============ VERIFY EMAIL END ============')

      return { 
        success: true, 
        data: result,
        user: result.user,
        session: result.session
      }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useEmailVerification] ✗ Verification failed:', errorMessage)
      console.error('[useEmailVerification] ============ VERIFY EMAIL ERROR ============')
      error.value = errorMessage
      return { 
        success: false, 
        error: errorMessage 
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Resend verification email
   */
  const resendVerificationEmail = async (email: string) => {
    loading.value = true
    error.value = ''
    success.value = ''

    try {
      console.log('[useEmailVerification] ============ RESEND EMAIL START ============')
      console.log('[useEmailVerification] Resending verification email to:', email)

      if (!email) {
        throw new Error('Email is required')
      }

      // ✅ Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }

      console.log('[useEmailVerification] Sending resend request to API...')
      
      const result = await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })

      console.log('[useEmailVerification] Resend response received:', {
        success: result?.success,
        message: result?.message
      })

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to resend verification email')
      }

      success.value = result.message || 'Verification email sent! Check your inbox.'
      console.log('[useEmailVerification] ✅ Verification email resent')
      console.log('[useEmailVerification] ============ RESEND EMAIL END ============')

      return { 
        success: true, 
        data: result
      }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useEmailVerification] ✗ Resend failed:', errorMessage)
      console.error('[useEmailVerification] ============ RESEND EMAIL ERROR ============')
      error.value = errorMessage
      return { 
        success: false, 
        error: errorMessage 
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    success,
    verifyEmail,
    resendVerificationEmail
  }
}
