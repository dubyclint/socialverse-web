// FILE: /server/models/universe-message.ts
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

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
export interface UniverseMessage {
  id: string
  senderId: string
  recipientId?: string
  content: string
  attachments?: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
  deletedAt?: string
  messageType?: string
  mediaUrl?: string
  replyToId?: string
  location?: string
  isAnonymous?: boolean
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UniverseMessageModel {
  static async sendMessage(
    senderId: string,
    content: string,
    messageType?: string,
    mediaUrl?: string,
    replyToId?: string,
    location?: string,
    isAnonymous?: boolean,
    recipientId?: string
  ): Promise<UniverseMessage> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .insert({
          senderId,
          recipientId,
          content,
          messageType: messageType || 'text',
          mediaUrl,
          replyToId,
          location,
          isAnonymous: isAnonymous || false,
          isRead: false,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Error sending message:', error)
      throw error
    }
  }

  static async getMessage(id: string): Promise<UniverseMessage | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .select('*')
        .eq('id', id)
        .is('deletedAt', null)
        .single()

      if (error) {
        console.warn('[UniverseMessageModel] Message not found')
        return null
      }

      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Error fetching message:', error)
      throw error
    }
  }

  static async getUserMessages(userId: string, limit = 50, offset = 0): Promise<UniverseMessage[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .select('*')
        .eq('recipientId', userId)
        .is('deletedAt', null)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as UniverseMessage[]
    } catch (error) {
      console.error('[UniverseMessageModel] Error fetching user messages:', error)
      throw error
    }
  }

  static async getMessages(limit = 50, offset = 0, location?: string): Promise<UniverseMessage[]> {
    try {
      const supabase = await getSupabase()
      let query = supabase
        .from('universe_messages')
        .select('*')
        .is('deletedAt', null)
        .is('replyToId', null)

      if (location) {
        query = query.eq('location', location)
      }

      const { data, error } = await query
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as UniverseMessage[]
    } catch (error) {
      console.error('[UniverseMessageModel] Error fetching messages:', error)
      throw error
    }
  }

  static async getUnreadMessages(userId: string): Promise<UniverseMessage[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .select('*')
        .eq('recipientId', userId)
        .eq('isRead', false)
        .is('deletedAt', null)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as UniverseMessage[]
    } catch (error) {
      console.error('[UniverseMessageModel] Error fetching unread messages:', error)
      throw error
    }
  }

  static async markAsRead(id: string): Promise<UniverseMessage> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .update({
          isRead: true,
          readAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Error marking as read:', error)
      throw error
    }
  }

  static async deleteMessage(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('universe_messages')
        .update({ deletedAt: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[UniverseMessageModel] Error deleting message:', error)
      throw error
    }
  }

  static async getReplies(messageId: string, limit = 50, offset = 0): Promise<UniverseMessage[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .select('*')
        .eq('replyToId', messageId)
        .is('deletedAt', null)
        .order('createdAt', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as UniverseMessage[]
    } catch (error) {
      console.error('[UniverseMessageModel] Error fetching replies:', error)
      throw error
    }
  }

  static async updateMessage(id: string, updates: Partial<UniverseMessage>): Promise<UniverseMessage> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Error updating message:', error)
      throw error
    }
  }
}

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new universe message
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  sender_id: string
  content: string
  message_type?: string
  media_url?: string
  reply_to_id?: string
  location?: string
  is_anonymous?: boolean
}): Promise<UniverseMessage> {
  return UniverseMessageModel.sendMessage(
    data.sender_id,
    data.content,
    data.message_type,
    data.media_url,
    data.reply_to_id,
    data.location,
    data.is_anonymous
  )
}

/**
 * Find universe message by ID
 */
export async function findById(id: string): Promise<UniverseMessage | null> {
  return UniverseMessageModel.getMessage(id)
}

/**
 * Find universe messages
 */
export async function findMessages(
  limit = 50,
  offset = 0,
  location?: string
): Promise<UniverseMessage[]> {
  return UniverseMessageModel.getMessages(limit, offset, location)
}

/**
 * Find message replies
 */
export async function findReplies(
  messageId: string,
  limit = 20,
  offset = 0
): Promise<UniverseMessage[]> {
  return UniverseMessageModel.getReplies(messageId, limit, offset)
}

/**
 * Update universe message
 */
export async function update(
  id: string,
  updates: Partial<UniverseMessage>
): Promise<UniverseMessage> {
  return UniverseMessageModel.updateMessage(id, updates)
}

/**
 * Delete universe message
 */
export async function delete_(id: string): Promise<void> {
  return UniverseMessageModel.deleteMessage(id)
}

/**
 * Mark message as read
 */
export async function markAsRead(id: string): Promise<UniverseMessage> {
  return UniverseMessageModel.markAsRead(id)
}

/**
 * Get unread messages
 */
export async function getUnread(userId: string): Promise<UniverseMessage[]> {
  return UniverseMessageModel.getUnreadMessages(userId)
}
