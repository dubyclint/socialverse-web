// ============================================================================
// FILE: /composables/use-email-verification.ts - EMAIL VERIFICATION COMPOSABLE
// ============================================================================
// This composable handles email verification logic
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
   */
  const verifyEmail = async (token: string, type: 'email' | 'recovery' = 'email') => {
    loading.value = true
    error.value = ''
    success.value = ''

    try {
      console.log('[useEmailVerification] Verifying email with token...')

      if (!token) {
        throw new Error('Verification token is required')
      }

      const result = await $fetch('/api/auth/verify-email', {
        method: 'POST',
        body: {
          token,
          type
        }
      })

      console.log('[useEmailVerification] Verification response:', result)

      if (!result?.success) {
        throw new Error(result?.message || 'Email verification failed')
      }

      success.value = result.message || 'Email verified successfully!'
      console.log('[useEmailVerification] ✅ Email verified')

      return { 
        success: true, 
        data: result,
        user: result.user,
        session: result.session
      }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useEmailVerification] ✗ Verification failed:', errorMessage)
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
      console.log('[useEmailVerification] Resending verification email to:', email)

      if (!email) {
        throw new Error('Email is required')
      }

      const result = await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })

      console.log('[useEmailVerification] Resend response:', result)

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to resend verification email')
      }

      success.value = result.message || 'Verification email sent! Check your inbox.'
      console.log('[useEmailVerification] ✅ Verification email resent')

      return { 
        success: true, 
        data: result
      }

    } catch (err: any) {
      const errorMessage = extractErrorMessage(err)
      console.error('[useEmailVerification] ✗ Resend failed:', errorMessage)
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
