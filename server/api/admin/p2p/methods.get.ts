import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'manager')
  const { status } = getQuery(event) as { status?: Database['public']['Enums']['seller_method_state'] }
  const supabase = await serverSupabaseClient<Database>(event)

  let query = supabase
    .from('seller_payment_methods')
    .select('*')
    .order('created_at', { ascending: false })

  query = query.eq('status', status ?? 'PENDING')

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { methods: data ?? [] }
})
