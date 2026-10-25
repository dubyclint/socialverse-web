import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { hashRecoveryCode } from '~/server/utils/mfa'

/**
 * Lost-phone sign-in: a valid unused recovery code removes the authenticator so the
 * password session can continue. The user is asked to set 2FA up again.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'mfa:recover', { limit: 5, windowMs: 15 * 60_000 }, user.id)
  const body = await readBody<{ code?: string }>(event).catch(() => null)
  const code = String(body?.code ?? '')
  if (code.replace(/[^A-Za-z0-9]/g, '').length < 10) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a recovery code' })
  }
  const service = getServiceClient()
  const { data: row } = await service.from('user_mfa_recovery_codes' as never)
    .select('id')
    .eq('user_id', user.id)
    .eq('code_hash', hashRecoveryCode(code))
    .is('used_at', null)
    .maybeSingle()
  if (!row) throw createError({ statusCode: 400, statusMessage: 'That recovery code is not valid' })

  await service.from('user_mfa_recovery_codes' as never)
    .update({ used_at: new Date().toISOString() } as never)
    .eq('id', (row as { id: string }).id)
  const { data: factors } = await service.auth.admin.mfa.listFactors({ userId: user.id })
  for (const factor of factors?.factors ?? []) {
    await service.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id })
  }
  await service.from('user_mfa_recovery_codes' as never).delete().eq('user_id', user.id)
  return { success: true }
})
