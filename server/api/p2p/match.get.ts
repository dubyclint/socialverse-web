import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/**
 * Ranked seller list for a buyer's deposit order. Ordering (privilege, asset
 * match, lowest effective price, verification, alternative payment cover) is
 * enforced inside match_p2p_sellers so it cannot be gamed from the client.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { asset, amount, limit } = getQuery(event) as { asset?: string; amount?: string; limit?: string }

  const parsedAmount = Number(amount)
  if (!asset || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'asset and a positive amount are required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)
  const { data, error } = await supabase.rpc('match_p2p_sellers', {
    p_asset_code: asset,
    p_amount: parsedAmount,
    p_limit: Math.min(Number(limit) || 20, 50)
  })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { amount: parsedAmount, asset, matches: data ?? [] }
})
