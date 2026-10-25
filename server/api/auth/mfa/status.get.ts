import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { count } = await getServiceClient()
    .from('user_mfa_recovery_codes' as never)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('used_at', null)
  return { recoveryCodesLeft: count ?? 0 }
})
