// FILE: /server/models/universe-message.ts
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
export interface UniverseMessage {
  id: string
  senderId: string
  recipientId: string
  content: string
  attachments?: string[]
  isRead: boolean
  readAt?: string
  createdAt: string
  deletedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UniverseMessageModel {
  static async sendMessage(senderId: string, recipientId: string, content: string, attachments?: string[]): Promise<UniverseMessage> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .insert({
          senderId,
          recipientId,
          content,
          attachments,
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

  static async getConversation(userId1: string, userId2: string, limit = 50): Promise<UniverseMessage[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('universe_messages')
        .select('*')
        .or(`and(senderId.eq.${userId1},recipientId.eq.${userId2}),and(senderId.eq.${userId2},recipientId.eq.${userId1})`)
        .is('deletedAt', null)
        .order('createdAt', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data || []) as UniverseMessage[]
    } catch (error) {
      console.error('[UniverseMessageModel] Error fetching conversation:', error)
      throw error
    }
  }
}
