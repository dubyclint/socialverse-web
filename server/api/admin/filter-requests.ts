// ============================================================================
// 4. server/api/admin/filter-requests.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('filter_requests')
      .select('*')
      .eq('status', 'pending')

    if (error) throw error
    return data || []
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch filter requests'
    })
  }
})
