import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** First of two confirmations by the party holding escrow that the money arrived. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })
  const { data, error } = await getServiceClient().rpc('confirm_p2p_receipt' as never, { p_trade_id: id, p_actor_id: user.id } as never)
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { confirmedAt: data }
})
