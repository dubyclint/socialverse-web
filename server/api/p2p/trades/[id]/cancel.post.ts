import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Either party (or an admin) cancels; the lock is refunded to the seller. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ reason?: string }>(event)
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Trade id is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { data, error } = await supabase.rpc('cancel_p2p_trade', {
    p_trade_id: id,
    p_actor_id: user.id,
    p_reason: body?.reason ?? undefined
  })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { refunded: data }
})
