// FILE: /server/models/chat-session.ts
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
export interface ChatSession {
  id: string
  userId: string
  conversationId: string
  joinedAt: string
  leftAt?: string
  isActive: boolean
  lastActivityAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ChatSessionModel {
  static async createSession(userId: string, conversationId: string): Promise<ChatSession> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          userId,
          conversationId,
          joinedAt: new Date().toISOString(),
          isActive: true,
          lastActivityAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ChatSession
    } catch (error) {
      console.error('[ChatSessionModel] Error creating session:', error)
      throw error
    }
  }

  static async getActiveSession(userId: string, conversationId: string): Promise<ChatSession | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('userId', userId)
        .eq('conversationId', conversationId)
        .eq('isActive', true)
        .single()

      if (error) {
        console.warn('[ChatSessionModel] Active session not found')
        return null
      }

      return data as ChatSession
    } catch (error) {
      console.error('[ChatSessionModel] Error fetching session:', error)
      throw error
    }
  }

  static async endSession(sessionId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          isActive: false,
          leftAt: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('[ChatSessionModel] Error ending session:', error)
      throw error
    }
  }

  static async updateActivity(sessionId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('chat_sessions')
        .update({ lastActivityAt: new Date().toISOString() })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('[ChatSessionModel] Error updating activity:', error)
      throw error
    }
  }

  static async getConversationParticipants(conversationId: string): Promise<ChatSession[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('conversationId', conversationId)
        .eq('isActive', true)

      if (error) throw error
      return (data || []) as ChatSession[]
    } catch (error) {
      console.error('[ChatSessionModel] Error fetching participants:', error)
      throw error
    }
  }
}
