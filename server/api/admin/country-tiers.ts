// ============================================================================
// 2. server/api/admin/country-tiers.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const method = getMethod(event)

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('country_tiers')
        .select('*')

      if (error) throw error
      return data || []
    }

    if (method === 'POST') {
      const { country, tier } = await readBody(event)

      const { error } = await supabase
        .from('country_tiers')
        .upsert({ country, tier }, { onConflict: 'country' })

      if (error) throw error
      return { success: true }
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage country tiers'
    })
  }
})
