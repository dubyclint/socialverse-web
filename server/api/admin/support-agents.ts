// ============================================================================
// 7. server/api/admin/support-agents.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const method = getMethod(event)

    if (method === 'GET') {
      const { region, feature } = getQuery(event)
      let query = supabase
        .from('support_agents')
        .select('*')
        .eq('active', true)

      if (region) query = query.eq('region', region)
      if (feature) query = query.eq('assigned_features', feature)

      const { data, error } = await query

      if (error) throw error
      return data || []
    }

    if (method === 'POST') {
      const agent = await readBody(event)

      if (!agent.agent_id || !agent.name || !agent.method) {
        return { success: false, message: 'Missing required fields.' }
      }

      agent.last_seen = new Date().toISOString()

      const { error } = await supabase
        .from('support_agents')
        .upsert(agent, { onConflict: 'agent_id' })

      if (error) throw error
      return { success: true, message: 'Agent saved.' }
    }

    if (method === 'DELETE') {
      const { agent_id } = await readBody(event)

      const { error } = await supabase
        .from('support_agents')
        .delete()
        .eq('agent_id', agent_id)

      if (error) throw error
      return { success: true, message: 'Agent removed.' }
    }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage support agents'
    })
  }
})
