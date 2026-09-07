import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

type SlotRow = Database['public']['Tables']['external_ad_slots']['Row']

export default defineEventHandler(async (event): Promise<{ success: boolean, data: SlotRow[] }> => {
  await requireAdmin(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('external_ad_slots')
    .select('*')
    .order('bid_per_mille', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: data ?? [] }
})
