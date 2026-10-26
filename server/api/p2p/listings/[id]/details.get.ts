import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Seller payment details + notes, shown after the user picks a seller and before "I'm paying". */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })
  const db = getServiceClient()
  const { data: l } = await db.from('p2p_listings').select('id, seller_id, side, terms, payment_method_id, is_active').eq('id', id).maybeSingle()
  if (!l || !l.is_active) throw createError({ statusCode: 404, statusMessage: 'Offer not found' })
  const [{ data: m }, { data: p }] = await Promise.all([
    db.from('seller_payment_methods').select('kind, account_name, account_ref, bank_name, network, instructions, status').eq('id', l.payment_method_id ?? '').maybeSingle(),
    db.from('seller_profiles').select('display_name, buyer_notes').eq('user_id', l.seller_id).maybeSingle()
  ])
  if (!m || m.status !== 'APPROVED') throw createError({ statusCode: 400, statusMessage: 'Seller payment method is not available' })
  const prof = p as { display_name?: string | null, buyer_notes?: string | null } | null
  return {
    side: (l as { side?: string }).side ?? 'sell',
    terms: l.terms,
    buyer_notes: prof?.buyer_notes ?? null,
    seller_name: prof?.display_name ?? null,
    method: (l as { side?: string }).side === 'buy' ? { kind: m.kind, bank_name: m.bank_name, network: m.network, instructions: m.instructions } : m
  }
})
