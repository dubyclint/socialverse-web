import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Raises a dispute; escrow stays locked until an admin resolves it. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ reason?: string }>(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })
  if (!body?.reason) throw createError({ statusCode: 400, statusMessage: 'A reason is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { error } = await supabase.rpc('dispute_p2p_trade', {
    p_trade_id: id,
    p_actor_id: user.id,
    p_reason: body.reason
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { success: true }
})
