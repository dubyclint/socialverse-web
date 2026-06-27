// ============================================================================
// 5. server/api/admin/premium-rules.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const method = getMethod(event)

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('premium_access_rules')
        .select('*')

      if (error) throw error
      return data || []
    }

    if (method === 'POST') {
      const rule = await readBody(event)

      if (!rule.target || !rule.value || !rule.features) {
        return { success: false, message: 'Missing required fields.' }
      }

      rule.updated_at = new Date().toISOString()
      rule.created_at = rule.created_at || new Date().toISOString()

      const { error } = await supabase
        .from('premium_access_rules')
        .upsert(rule, { onConflict: 'target,value' })

      if (error) throw error
      return { success: true, message: 'Rule saved.' }
    }

    if (method === 'DELETE') {
      const { target, value } = await readBody(event)

      if (!target || !value) {
        return { success: false, message: 'Missing target or value.' }
      }

      const { error } = await supabase
        .from('premium_access_rules')
        .delete()
        .eq('target', target)
        .eq('value', value)

      if (error) throw error
      return { success: true, message: 'Rule deleted.' }
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage premium rules'
    })
  }
})
