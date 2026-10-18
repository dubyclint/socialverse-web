import { serverSupabaseClient } from '#supabase/server'
import { requireStaff } from '~/server/utils/staff'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  await requireStaff(event, 'ads')

  const id = String(getQuery(event).id ?? '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const supabase = await serverSupabaseClient<Database>(event)
  const { error } = await supabase.from('external_ad_slots').delete().eq('id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
