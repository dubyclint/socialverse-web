import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Seller (or an admin resolving a dispute) releases escrow to the buyer. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { data, error } = await supabase.rpc('release_p2p_trade', {
    p_trade_id: id,
    p_actor_id: user.id
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { released: data }
})
