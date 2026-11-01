import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getKyc, getKycSettings, isNamePrivileged } from '~/server/utils/kyc'
import { pollDiditDecision } from '~/server/utils/didit'

/** The caller's own KYC state, fee, admin sentence and latest request. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getServiceClient()
  // Without a webhook, settle a pending Didit session by fetching its decision (at most every 20s).
  const { data: open } = await db.from('kyc_requests' as never).select('id, user_id, status, didit_session_id, updated_at')
    .eq('user_id', user.id).eq('method', 'didit').in('status', ['pending', 'in_review']).order('created_at', { ascending: false }).limit(1).maybeSingle()
  const o = open as { id: string, user_id: string, status: string, didit_session_id: string | null, updated_at: string } | null
  if (o && Date.now() - new Date(o.updated_at).getTime() > 20_000) {
    await db.from('kyc_requests' as never).update({ updated_at: new Date().toISOString() } as never).eq('id', o.id)
    await pollDiditDecision(event, o).catch(() => {})
  }
  const [kyc, settings, { data: last }, { data: wallet }, privileged] = await Promise.all([
    getKyc(user.id),
    getKycSettings(),
    db.from('kyc_requests' as never).select('id, method, status, review_note, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('wallets').select('balance').eq('user_id', user.id).eq('currency', 'PEW').maybeSingle(),
    isNamePrivileged(user.id)
  ])
  return { kyc, settings, request: last, balance: Number(wallet?.balance ?? 0), didit_enabled: Boolean(process.env.DIDIT_API_KEY), privileged, user_id: user.id }
})
