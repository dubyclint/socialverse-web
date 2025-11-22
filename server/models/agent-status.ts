import { supabase } from '~/server/db'

export interface AgentStatus {
  id: string
  agentId: string
  online: boolean
  lastSeen: string
  currentSessions: number
  maxSessions: number
  updatedAt: string
}

export class AgentStatusModel {
  static async create(agentId: string, maxSessions: number = 5) {
    const { data, error } = await supabase
      .from('agent_statuses')
      .insert([
        {
          agent_id: agentId,
          online: false,
          last_seen: new Date().toISOString(),
          current_sessions: 0,
          max_sessions: maxSessions,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as AgentStatus
  }

  static async getByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from('agent_statuses')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as AgentStatus | null
  }

  static async setOnline(agentId: string, online: boolean) {
    const { data, error } = await supabase
      .from('agent_statuses')
      .update({
        online,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .select()
      .single()

    if (error) throw error
    return data as AgentStatus
  }

  static async updateSessions(agentId: string, currentSessions: number) {
    const { data, error } = await supabase
      .from('agent_statuses')
      .update({
        current_sessions: currentSessions,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .select()
      .single()

    if (error) throw error
    return data as AgentStatus
  }

  static async getOnlineAgents() {
    const { data, error } = await supabase
      .from('agent_statuses')
      .select('*')
      .eq('online', true)

    if (error) throw error
    return data as AgentStatus[]
  }
}
