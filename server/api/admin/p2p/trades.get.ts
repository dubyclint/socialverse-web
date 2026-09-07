import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'manager')
  const { status, limit } = getQuery(event) as {
    status?: Database['public']['Enums']['p2p_trade_status']
    limit?: string
  }
  const supabase = await serverSupabaseClient<Database>(event)

  let query = supabase
    .from('p2p_trades')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 100, 500))

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { trades: data ?? [] }
})
