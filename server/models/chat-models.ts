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

// ---------------------------------------------------------------------------
// (legacy aliases moved below, after ChatModel declaration)

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

// ---------------------------------------------------------------------------
// Runtime-shaped compatibility adapters (preserve legacy controller API)
// These provide value-shaped exports like `Chat.create(...)`,
// `ChatMessage.create(...)`, `ChatParticipant.create(...)` which many
// controllers still expect. They are thin wrappers around the refactored
// ChatModel methods or direct Supabase operations.
// ---------------------------------------------------------------------------

export const Chat: any = {
  async create(payload: any) {
    // payload expected to include fields like name, description, avatar,
    // creator_id, is_group, participants (legacy callers vary). Insert
    // directly into the chat_conversations table so callers don't need to
    // be updated yet.
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('[Chat adapter] create error', err)
      throw err
    }
  },

  async findOne(opts: any) {
    const id = opts?.where?.id || opts?.where?.conversationId
    if (!id) return null
    try {
      // Prefer the refactored helper when possible
      const conv = await ChatModel.getConversation(id)
      return conv
    } catch (err) {
      console.error('[Chat adapter] findOne error', err)
      throw err
    }
  },

  async update(values: any, opts: any) {
    const id = opts?.where?.id
    if (!id) throw new Error('Chat.update requires where.id')
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_conversations')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('[Chat adapter] update error', err)
      throw err
    }
  },

  async destroy(opts: any) {
    const id = opts?.where?.id
    if (!id) throw new Error('Chat.destroy requires where.id')
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('[Chat adapter] destroy error', err)
      throw err
    }
  }
}

export const ChatMessage: any = {
  async create(payload: any) {
    // Map legacy keys to the refactored ChatModel.sendMessage where useful.
    const conversationId = payload.conversationId || payload.chat_id
    const senderId = payload.senderId || payload.sender_id
    const content = payload.content
    const attachments = payload.attachments || payload.attachments

    if (!conversationId || !senderId) {
      // Fallback to direct insert if callers provided different payloads
      try {
        const supabase = await getSupabase()
        const insertPayload = {
          ...payload,
          conversationId: conversationId,
          senderId: senderId
        }
        const { data, error } = await supabase
          .from('chat_messages')
          .insert(insertPayload)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (err) {
        console.error('[ChatMessage adapter] create fallback error', err)
        throw err
      }
    }

    // Use the refactored helper for the common path
    return ChatModel.sendMessage(conversationId, senderId, content, attachments)
  },

  async findAll(opts: any) {
    // Expect opts = { where: { chat_id: string }, limit, offset, order }
    const convoId = opts?.where?.chat_id || opts?.where?.conversationId
    const limit = opts?.limit || 50
    const offset = opts?.offset || 0
    if (!convoId) return []
    try {
      return await ChatModel.getMessages(convoId, limit, offset)
    } catch (err) {
      console.error('[ChatMessage adapter] findAll error', err)
      throw err
    }
  }
}

export const ChatParticipant: any = {
  async create(payload: any) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('chat_participants')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('[ChatParticipant adapter] create error', err)
      throw err
    }
  },

  async findOne(opts: any) {
    try {
      const where = opts?.where || {}
      const supabase = await getSupabase()
      let q = supabase.from('chat_participants').select('*')
      if (where.chat_id) q = q.eq('chat_id', where.chat_id)
      if (where.user_id) q = q.eq('user_id', where.user_id)
      const { data, error } = await q.limit(1).maybeSingle()
      if (error) throw error
      return data
    } catch (err) {
      console.error('[ChatParticipant adapter] findOne error', err)
      throw err
    }
  },

  async findAll(opts: any) {
    try {
      const where = opts?.where || {}
      const supabase = await getSupabase()
      let q = supabase.from('chat_participants').select('*')
      if (where.chat_id) q = q.eq('chat_id', where.chat_id)
      const { data, error } = await q
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('[ChatParticipant adapter] findAll error', err)
      throw err
    }
  },

  async destroy(opts: any) {
    try {
      const idWhere = opts?.where || {}
      const supabase = await getSupabase()
      let q = supabase.from('chat_participants').delete()
      if (idWhere.chat_id) q = q.eq('chat_id', idWhere.chat_id)
      if (idWhere.user_id) q = q.eq('user_id', idWhere.user_id)
      const { error } = await q
      if (error) throw error
      return true
    } catch (err) {
      console.error('[ChatParticipant adapter] destroy error', err)
      throw err
    }
  }
}

// ---------------------------------------------------------------------------
// Legacy compatibility aliases for ChatModel (placed after class declaration)
// These expose method names older controllers expect.
// ---------------------------------------------------------------------------
;(ChatModel as any).getUserChats = ChatModel.getUserConversations

;(ChatModel as any).createChat = async function (userId: string, participantId: string) {
  // Create a one-to-one conversation between two users
  const participants = [userId, participantId]
  return ChatModel.createConversation(participants, false)
}

;(ChatModel as any).markAsRead = async function (_chatId: string, _userId: string) {
  // Compatibility shim: controllers expect a markAsRead method.
  // Implemented as a no-op for now; can be replaced with real logic later.
  return true
}

;(ChatModel as any).deleteChat = async function (chatId: string, _userId: string) {
  try {
    const supabase = await getSupabase()
    const { error } = await supabase.from('chat_conversations').delete().eq('id', chatId)
    if (error) throw error
    return true
  } catch (err) {
    console.error('[ChatModel alias] deleteChat error', err)
    throw err
  }
}
