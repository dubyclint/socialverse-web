import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Trades the caller is a party to, newest first. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { status } = getQuery(event) as { status?: Database['public']['Enums']['p2p_trade_status'] }
  const supabase = await serverSupabaseClient<Database>(event)

  let query = supabase
    .from('p2p_trades')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { trades: data ?? [] }
})
