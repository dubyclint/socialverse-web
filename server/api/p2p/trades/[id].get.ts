import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getActor, hasRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

/** Full trade view including the seller payout details revealed by escrow. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const supabase = await serverSupabaseClient<Database>(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })

  const { data, error } = await supabase
    .from('p2p_trades')
    .select('*, seller_payment_methods(kind, asset_code, account_name, account_ref, bank_name, network, instructions)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Trade not found' })

  if (data.buyer_id !== user.id && data.seller_id !== user.id) {
    const actor = await getActor(event)
    if (!hasRole(actor, 'manager')) {
      throw createError({ statusCode: 403, statusMessage: 'Not a party to this trade' })
    }
  }

  return { trade: data }
})
