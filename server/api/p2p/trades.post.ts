import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
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

  if (!body.listingId || !body.amount || body.amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'listingId and a positive amount are required' })
  }
  if (!body.acceptedTerms) {
    throw createError({ statusCode: 400, statusMessage: 'Trade terms must be accepted' })
  }

  const { data: tradeId, error } = await supabase.rpc('open_p2p_trade', {
    p_listing_id: body.listingId,
    p_buyer_id: user.id,
    p_amount: body.amount
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  const { data: trade } = await supabase
    .from('p2p_trades')
    .select('*, seller_payment_methods(kind, asset_code, account_name, account_ref, bank_name, network, instructions)')
    .eq('id', tradeId)
    .single()

  return { trade }
})
