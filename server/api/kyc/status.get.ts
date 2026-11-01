import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getKyc, getKycSettings, isNamePrivileged } from '~/server/utils/kyc'

/** The caller's own KYC state, fee, admin sentence and latest request. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  const [kyc, settings, { data: last }, { data: wallet }, privileged] = await Promise.all([
    getKyc(user.id),
    getKycSettings(),
    db.from('kyc_requests' as never).select('id, method, status, review_note, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('wallets').select('balance').eq('user_id', user.id).eq('currency', 'PEW').maybeSingle(),
    isNamePrivileged(user.id)
  ])
  return { kyc, settings, request: last, balance: Number(wallet?.balance ?? 0), didit_enabled: Boolean(process.env.DIDIT_API_KEY), privileged, user_id: user.id }
})
