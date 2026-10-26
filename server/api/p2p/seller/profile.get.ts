import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'

export const MAX_SELLER_CONFIGS = 30

/** The caller's seller status, profile, and all currency/payment configurations. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getServiceClient()
  const { data: profile } = await db.from('seller_profiles').select('*').eq('user_id', user.id).maybeSingle()
  const isSeller = !!profile && profile.is_active && !profile.revoked_at
  if (!isSeller) return { isSeller: false, profile: null, configs: [], max: MAX_SELLER_CONFIGS }
  const [{ data: listings }, { data: methods }, { data: wallet }] = await Promise.all([
    db.from('p2p_listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    db.from('seller_payment_methods').select('*').eq('seller_id', user.id),
    db.from('wallets').select('balance, locked_balance').eq('user_id', user.id).maybeSingle()
  ])
  const byId = new Map((methods ?? []).map(m => [m.id, m]))
  const configs = (listings ?? []).map(l => ({ ...l, method: l.payment_method_id ? byId.get(l.payment_method_id) ?? null : null }))
  return { isSeller: true, profile, configs, max: MAX_SELLER_CONFIGS, wallet }
})
