// FILE: /server/models/chat-models.ts
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
export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachments?: Array<{
    type: string
    url: string
  }>
  reactions?: Record<string, number>
  isEdited: boolean
  editedAt?: string
  deletedAt?: string
  createdAt: string
}

export interface ChatConversation {
  id: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: string
  isGroup: boolean
  groupName?: string
  groupImage?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ChatModel {
  static async createConversation(participants: string[], isGroup = false, groupName?: string): Promise<ChatConversation> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          participants,
          isGroup,
          groupName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ChatConversation
    } catch (error) {
      console.error('[ChatModel] Error creating conversation:', error)
      throw error
    }
  }

  static async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) {
        console.warn('[ChatModel] Conversation not found')
        return null
      }

      return data as ChatConversation
    } catch (error) {
      console.error('[ChatModel] Error fetching conversation:', error)
      throw error
    }
  }

  static async getUserConversations(userId: string, limit = 50): Promise<ChatConversation[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .contains('participants', [userId])
        .order('lastMessageAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as ChatConversation[]
    } catch (error) {
      console.error('[ChatModel] Error fetching user conversations:', error)
      throw error
    }
  }

  static async sendMessage(conversationId: string, senderId: string, content: string, attachments?: any[]): Promise<ChatMessage> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversationId,
          senderId,
          content,
          attachments,
          isEdited: false,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ChatMessage
    } catch (error) {
      console.error('[ChatModel] Error sending message:', error)
      throw error
    }
  }

  static async getMessages(conversationId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversationId', conversationId)
        .is('deletedAt', null)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []).reverse() as ChatMessage[]
    } catch (error) {
      console.error('[ChatModel] Error fetching messages:', error)
      throw error
    }
  }

  static async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content,
          isEdited: true,
          editedAt: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return data as ChatMessage
    } catch (error) {
      console.error('[ChatModel] Error editing message:', error)
      throw error
    }
  }

  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('chat_messages')
        .update({ deletedAt: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('[ChatModel] Error deleting message:', error)
      throw error
    }
  }
}
