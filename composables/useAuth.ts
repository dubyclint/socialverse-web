import { computed } from 'vue'
import { useUserStore } from '~/stores/user'
import { useEmailVerification } from '~/composables/use-email-verification'

/**
 * Auth facade combining the user store session lifecycle with the email
 * verification pipeline. Kept as a thin adapter over existing functionality.
 */
export const useAuth = () => {
  const userStore = useUserStore()
  const { verifyEmail: verifyEmailToken, resendVerificationEmail } = useEmailVerification()

  const verifyEmail = (token: string, type: 'email' | 'recovery' | 'signup' = 'email') =>
    verifyEmailToken(token, type)

  const resendVerification = (email: string) => resendVerificationEmail(email)

  return {
    logout: userStore.logout,
    loading: computed(() => userStore.isLoading),
    verifyEmail,
    resendVerification
  }
}
