import { supabase } from '~/server/db'

export interface SupportAgent {
  id: string
  agentId: string
  name: string
  contact: string
  method: 'native' | 'widget' | 'redirect'
  assignedFeatures: string[]
  region?: string
  active: boolean
  lastSeen?: string
  updatedAt: string
}

export class SupportAgentModel {
  static async create(agentData: Omit<SupportAgent, 'id' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('support_agents')
      .insert([
        {
          agent_id: agentData.agentId,
          name: agentData.name,
          contact: agentData.contact,
          method: agentData.method,
          assigned_features: agentData.assignedFeatures,
          region: agentData.region,
          active: agentData.active,
          last_seen: agentData.lastSeen,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as SupportAgent
  }

  static async getByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as SupportAgent | null
  }

  static async getActive() {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .eq('active', true)

    if (error) throw error
    return data as SupportAgent[]
  }

  static async getByFeature(feature: string) {
    const { data, error } = await supabase
      .from('support_agents')
      .select('*')
      .contains('assigned_features', [feature])
      .eq('active', true)

    if (error) throw error
    return data as SupportAgent[]
  }

  static async update(agentId: string, updates: Partial<SupportAgent>) {
    const { data, error } = await supabase
      .from('support_agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .select()
      .single()

    if (error) throw error
    return data as SupportAgent
  }
}
