import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { generateRecoveryCodes, hashRecoveryCode } from '~/server/utils/mfa'

/** Issues a fresh set of recovery codes (replacing any old set). Shown once; only hashes are stored. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()
  const { data: factors } = await service.auth.admin.mfa.listFactors({ userId: user.id })
  if (!factors?.factors?.some(f => f.status === 'verified')) {
    throw createError({ statusCode: 400, statusMessage: 'Turn on two-factor authentication first' })
  }
  const codes = generateRecoveryCodes()
  await service.from('user_mfa_recovery_codes' as never).delete().eq('user_id', user.id)
  const { error } = await service.from('user_mfa_recovery_codes' as never)
    .insert(codes.map(code => ({ user_id: user.id, code_hash: hashRecoveryCode(code) })) as never)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { codes }
})
