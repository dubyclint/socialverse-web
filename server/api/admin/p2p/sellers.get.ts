import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'manager')
  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('seller_profiles')
    .select('*')
    .order('granted_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { sellers: data ?? [] }
})
