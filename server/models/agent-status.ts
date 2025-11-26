// FILE: /server/models/agent-status.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export type AgentStatusType = 'online' | 'offline' | 'busy' | 'away' | 'dnd'

export interface AgentStatus {
  id: string
  agentId: string
  status: AgentStatusType
  lastSeen: string
  statusMessage?: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class AgentStatusModel {
  static async getStatus(agentId: string): Promise<AgentStatus | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('agent_status')
        .select('*')
        .eq('agentId', agentId)
        .single()

      if (error) {
        console.warn('[AgentStatusModel] Status not found')
        return null
      }

      return data as AgentStatus
    } catch (error) {
      console.error('[AgentStatusModel] Error fetching status:', error)
      throw error
    }
  }

  static async setStatus(agentId: string, status: AgentStatusType, statusMessage?: string): Promise<AgentStatus> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('agent_status')
        .upsert({
          agentId,
          status,
          statusMessage,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as AgentStatus
    } catch (error) {
      console.error('[AgentStatusModel] Error setting status:', error)
      throw error
    }
  }

  static async getOnlineAgents(): Promise<AgentStatus[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('agent_status')
        .select('*')
        .eq('status', 'online')

      if (error) throw error
      return (data || []) as AgentStatus[]
    } catch (error) {
      console.error('[AgentStatusModel] Error fetching online agents:', error)
      throw error
    }
  }

  static async updateLastSeen(agentId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('agent_status')
        .update({ lastSeen: new Date().toISOString() })
        .eq('agentId', agentId)

      if (error) throw error
    } catch (error) {
      console.error('[AgentStatusModel] Error updating last seen:', error)
      throw error
    }
  }
}
