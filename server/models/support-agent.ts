// FILE: /server/models/support-agent.ts
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
export interface SupportAgent {
  id: string
  userId: string
  name: string
  email: string
  department: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  activeChats: number
  maxConcurrentChats: number
  rating: number
  totalChats: number
  responseTime: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class SupportAgentModel {
  static async createAgent(
    userId: string,
    name: string,
    email: string,
    department: string,
    maxConcurrentChats = 5
  ): Promise<SupportAgent> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_agents')
        .insert({
          userId,
          name,
          email,
          department,
          status: 'OFFLINE',
          activeChats: 0,
          maxConcurrentChats,
          rating: 0,
          totalChats: 0,
          responseTime: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SupportAgent
    } catch (error) {
      console.error('[SupportAgentModel] Error creating agent:', error)
      throw error
    }
  }

  static async getAgent(id: string): Promise<SupportAgent | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_agents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[SupportAgentModel] Agent not found')
        return null
      }

      return data as SupportAgent
    } catch (error) {
      console.error('[SupportAgentModel] Error fetching agent:', error)
      throw error
    }
  }

  static async getAvailableAgents(department?: string): Promise<SupportAgent[]> {
    try {
      const supabase = await getSupabase()
      let query = supabase
        .from('support_agents')
        .select('*')
        .eq('status', 'AVAILABLE')

      if (department) {
        query = query.eq('department', department)
      }

      const { data, error } = await query.order('activeChats', { ascending: true })

      if (error) throw error
      return (data || []) as SupportAgent[]
    } catch (error) {
      console.error('[SupportAgentModel] Error fetching available agents:', error)
      throw error
    }
  }

  static async updateAgentStatus(id: string, status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'): Promise<SupportAgent> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_agents')
        .update({
          status,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SupportAgent
    } catch (error) {
      console.error('[SupportAgentModel] Error updating agent status:', error)
      throw error
    }
  }

  static async incrementActiveChats(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.rpc('increment_agent_chats', {
        agent_id: id
      })

      if (error) throw error
    } catch (error) {
      console.error('[SupportAgentModel] Error incrementing active chats:', error)
      throw error
    }
  }

  static async decrementActiveChats(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.rpc('decrement_agent_chats', {
        agent_id: id
      })

      if (error) throw error
    } catch (error) {
      console.error('[SupportAgentModel] Error decrementing active chats:', error)
      throw error
    }
  }
}
