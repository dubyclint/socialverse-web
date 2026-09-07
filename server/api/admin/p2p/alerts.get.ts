import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

/** Anti-fraud feed: frozen-listing edit attempts, disputes and other alerts. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'manager')
  const { kind, limit } = getQuery(event) as { kind?: string; limit?: string }
  const supabase = await serverSupabaseClient<Database>(event)

  let query = supabase
    .from('security_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 100, 500))

  if (kind) query = query.eq('kind', kind)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { alerts: data ?? [] }
})
