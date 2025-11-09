import { supabase } from '~/server/db'

export interface ChatMessage {
  sender: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
}

export interface ChatSession {
  id: string
  sessionId: string
  userId: string
  agentId?: string
  startedAt: string
  endedAt?: string
  status: 'open' | 'closed' | 'escalated'
  messages: ChatMessage[]
  escalatedTo?: string
  updatedAt: string
}

export class ChatSessionModel {
  static async create(userId: string, agentId?: string) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          agent_id: agentId,
          started_at: new Date().toISOString(),
          status: 'open',
          messages: [],
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as ChatSession
  }

  static async getById(sessionId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as ChatSession | null
  }

  static async addMessage(sessionId: string, message: ChatMessage) {
    const session = await this.getById(sessionId)
    if (!session) throw new Error('Session not found')

    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        messages: [...(session.messages || []), message],
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data as ChatSession
  }

  static async closeSession(sessionId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        status: 'closed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data as ChatSession
  }

  static async escalateSession(sessionId: string, escalatedTo: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({
        status: 'escalated',
        escalated_to: escalatedTo,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data as ChatSession
  }

  static async getUserSessions(userId: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data as ChatSession[]
  }
}
