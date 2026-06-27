// FILE: /server/models/live-chat-config.ts
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
export interface LiveChatConfig {
  id: string
  name: string
  description?: string
  isEnabled: boolean
  maxConcurrentChats: number
  responseTimeLimit: number
  autoAssignmentEnabled: boolean
  routingRules?: Record<string, any>
  createdAt: string
  updatedAt: string
  updatedBy: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class LiveChatConfigModel {
  static async getConfig(id: string): Promise<LiveChatConfig | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('live_chat_configs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[LiveChatConfigModel] Config not found')
        return null
      }

      return data as LiveChatConfig
    } catch (error) {
      console.error('[LiveChatConfigModel] Error fetching config:', error)
      throw error
    }
  }

  static async getEnabledConfigs(): Promise<LiveChatConfig[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('live_chat_configs')
        .select('*')
        .eq('isEnabled', true)

      if (error) throw error
      return (data || []) as LiveChatConfig[]
    } catch (error) {
      console.error('[LiveChatConfigModel] Error fetching enabled configs:', error)
      throw error
    }
  }

  static async createConfig(config: Omit<LiveChatConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveChatConfig> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('live_chat_configs')
        .insert({
          ...config,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as LiveChatConfig
    } catch (error) {
      console.error('[LiveChatConfigModel] Error creating config:', error)
      throw error
    }
  }

  static async updateConfig(id: string, updates: Partial<LiveChatConfig>): Promise<LiveChatConfig> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('live_chat_configs')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiveChatConfig
    } catch (error) {
      console.error('[LiveChatConfigModel] Error updating config:', error)
      throw error
    }
  }
}
