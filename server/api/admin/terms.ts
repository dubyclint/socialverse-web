// ============================================================================
// 8. server/api/admin/terms.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const method = getMethod(event)

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('terms_and_policies')
        .select('*')

      if (error) throw error
      return data || []
    }

    if (method === 'POST') {
      const { feature, content, admin_id } = await readBody(event)

      if (!feature || !content) {
        return {
          success: false,
          message: 'Feature and content are required.'
        }
      }

      const updatePayload = {
        feature,
        content,
        last_updated: new Date().toISOString(),
        updated_by: admin_id || 'system'
      }

      const { error } = await supabase
        .from('terms_and_policies')
        .upsert(updatePayload, { onConflict: 'feature' })

      if (error) throw error

      return {
        success: true,
        message: `Terms for '${feature}' updated.`,
        updated: updatePayload
      }
    }

    if (method === 'DELETE') {
      const { feature } = await readBody(event)

      if (!feature) {
        return {
          success: false,
          message: 'Feature name is required for deletion.'
        }
      }

      const { error } = await supabase
        .from('terms_and_policies')
        .delete()
        .eq('feature', feature)

      if (error) throw error

      return {
        success: true,
        message: `Terms for '${feature}' deleted.`
      }
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage terms and policies'
    })
  }
})
