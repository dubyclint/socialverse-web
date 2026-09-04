import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { requireAmount, requireUuid } from '~/server/utils/input'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import type { Database } from '~/types/database.types'

interface OpenTradeBody {
  listingId?: string
  amount?: number
  acceptedTerms?: boolean
}

/**
 * Opening a trade locks the seller's credits into escrow and reveals their
 * payout details to the buyer. Price and fee are derived inside open_p2p_trade.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<OpenTradeBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const listingId = requireUuid(body.listingId, 'listingId')
  const amount = requireAmount(body.amount, 'amount')

  if (!body.acceptedTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Trade terms must be accepted' })
  }

  await enforceRateLimit(event, 'p2p:open-trade', { limit: 10, windowMs: 60_000 }, user.id)

  const { data: tradeId, error } = await supabase.rpc('open_p2p_trade', {
    p_listing_id: listingId,
    p_buyer_id: user.id,
    p_amount: amount
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  const { data: trade } = await supabase
    .from('p2p_trades')
    .select('*, seller_payment_methods(kind, asset_code, account_name, account_ref, bank_name, network, instructions)')
    .eq('id', tradeId)
    .single()

  return { trade }
})
