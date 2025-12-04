// ============================================================================
// 3. server/api/admin/fee-settings.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const method = getMethod(event)

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('fee_settings')
        .select('*')

      if (error) throw error
      return data || []
    }

    if (method === 'POST') {
      const fee = await readBody(event)

      const { error } = await supabase
        .from('fee_settings')
        .upsert(fee, { onConflict: 'type' })

      if (error) throw error
      return { success: true }
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage fee settings'
    })
  }
})
