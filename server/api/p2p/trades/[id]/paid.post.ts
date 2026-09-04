import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Buyer declares the off-platform payment sent; escrow stays locked. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { data, error } = await supabase.rpc('declare_p2p_paid', {
    p_trade_id: id,
    p_actor_id: user.id
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { paidDeclaredAt: data }
})
