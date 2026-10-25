import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Turns 2FA off. Reaching this route already requires a fully verified (aal2) session. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()
  const { data: factors } = await service.auth.admin.mfa.listFactors({ userId: user.id })
  for (const factor of factors?.factors ?? []) {
    await service.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id })
  }
  await service.from('user_mfa_recovery_codes' as never).delete().eq('user_id', user.id)
  return { success: true }
})
