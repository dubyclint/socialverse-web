import { useSupabaseClient } from '#imports'

/** Supabase TOTP helpers shared by sign-in, route guards and Settings > Security. */
export const useMfa = () => {
  const supabase = useSupabaseClient()

  /** True when the password step is done but the authenticator code is still owed. */
  const isPending = async (): Promise<boolean> => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
  }

  const verifiedTotp = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    return data?.totp?.find(f => f.status === 'verified') ?? null
  }

  const verifyCode = async (code: string) => {
    const factor = await verifiedTotp()
    if (!factor) throw new Error('No authenticator is set up on this account')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
    if (error) throw new Error('That code is not correct. Check your authenticator app and try again.')
  }

  const useRecoveryCode = async (code: string) => {
    await $fetch('/api/auth/mfa/recover', { method: 'POST', body: { code } })
    await supabase.auth.refreshSession()
  }

  return { isPending, verifiedTotp, verifyCode, useRecoveryCode }
}
