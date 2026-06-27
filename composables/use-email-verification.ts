// ============================================================================
// FILE: /composables/use-email-verification.ts - FIXED COMPOSABLE
// Description: Manages security token submission and verification requests.
// ============================================================================
import { ref } from 'vue'

export const useEmailVerification = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Submit a validation token back up to the backend verification engine
   */
  const verifyEmail = async (token: string, type: 'email' | 'recovery' | 'signup') => {
    loading.value = true
    error.value = null
    try {
      console.log('[Composable/VerifyEmail] Sending verification request to Nitro route...')
      const response = await $fetch<any>('/api/auth/verify-email', {
        method: 'POST',
        body: { token, type }
      })
      return { success: true, user: response?.user || null }
    } catch (err: any) {
      console.error('[Composable/VerifyEmail] Execution error caught:', err)
      const message = err.data?.statusMessage || err.message || 'Verification execution failed.'
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Trigger a secondary notification dispatch for users missing registration links
   */
  const resendVerificationEmail = async (email: string) => {
    loading.value = true
    error.value = null
    try {
      console.log('[Composable/ResendEmail] Sending resend trigger request targeting:', email)
      await $fetch('/api/auth/resend-verification', {
        method: 'POST',
        body: { email }
      })
      return { success: true }
    } catch (err: any) {
      console.error('[Composable/ResendEmail] Pipeline execution error:', err)
      const message = err.data?.statusMessage || err.message || 'Failed to resend authentication link.'
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }

  return {
    verifyEmail,
    resendVerificationEmail,
    loading,
    error
  }
}
