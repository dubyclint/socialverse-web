// server/models/chat-models.ts
// ============================================================================
// CONSOLIDATED CHAT MODELS
// Merges: chat.js + chat-message.js + chat-participant.js
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ChatType = 'direct' | 'group' | 'channel'
export type MessageType = 'text' | 'media' | 'system' | 'reaction'
export type ParticipantRole = 'owner' | 'admin' | 'moderator' | 'member'
export type ChatStatus = 'open' | 'closed' | 'archived'

export interface ChatSettings {
  allow_invites: boolean
  only_admins_can_message: boolean
  disappearing_messages: 'off' | '24h' | '7d' | '30d'
  read_receipts: boolean
  allow_reactions: boolean
  allow_media: boolean
}

export interface Chat {
  id: string
  type: ChatType
  name?: string
  description?: string
  avatar?: string
  created_by: string
  last_message_at: string
  is_active: boolean
  settings: ChatSettings
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  content?: string
  message_type: MessageType
  media_url?: string
  media_metadata?: any
  reply_to_id?: string
  quoted_message?: any
  is_edited: boolean
  is_deleted: boolean
  gun_id?: string
  created_at: string
  updated_at: string
}

export interface ChatParticipant {
  id: string
  chat_id: string
  user_id: string
  role: ParticipantRole
  joined_at: string
  last_read_at: string
  is_active: boolean
  is_muted: boolean
  muted_until?: string
  custom_name?: string
}

// ============================================================================
// CHAT MODEL
// ============================================================================

export class ChatModel {
  /**
   * Create a new chat
   */
  static async create(chatData: Partial<Chat>): Promise<Chat> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          type: chatData.type || 'direct',
          name: chatData.name || null,
          description: chatData.description || null,
          avatar: chatData.avatar || null,
          created_by: chatData.created_by,
          last_message_at: new Date().toISOString(),
          is_active: true,
          settings: {
            allow_invites: true,
            only_admins_can_message: false,
            disappearing_messages: 'off',
            read_receipts: true,
            allow_reactions: true,
            allow_media: true,
            ...chatData.settings
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  /**
   * Get chat by ID
   */
  static async getById(chatId: string): Promise<Chat | null> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting chat:', error)
      throw error
    }
  }

  /**
   * Update chat
   */
  static async update(chatId: string, updates: Partial<Chat>): Promise<Chat> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error updating chat:', error)
      throw error
    }
  }

  /**
   * Delete chat
   */
  static async delete(chatId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  /**
   * Get user's chats
   */
  static async getUserChats(userId: string, limit: number = 50): Promise<Chat[]> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) throw error

      const chatIds = data.map(p => p.chat_id)
      if (chatIds.length === 0) return []

      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('last_message_at', { ascending: false })
        .limit(limit)

      if (chatsError) throw chatsError
      return chats || []
    } catch (error: any) {
      console.error('Error getting user chats:', error)
      throw error
    }
  }
}

// ============================================================================
// CHAT MESSAGE MODEL
// ============================================================================

export class ChatMessageModel {
  /**
   * Create a new message
   */
  static async create(messageData: Partial<ChatMessage>): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: messageData.chat_id,
          sender_id: messageData.sender_id,
          content: messageData.content || null,
          message_type: messageData.message_type || 'text',
          media_url: messageData.media_url || null,
          media_metadata: messageData.media_metadata || null,
          reply_to_id: messageData.reply_to_id || null,
          quoted_message: messageData.quoted_message || null,
          is_edited: false,
          is_deleted: false,
          gun_id: messageData.gun_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating message:', error)
      throw error
    }
  }

  /**
   * Get messages for chat
   */
  static async getMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting messages:', error)
      throw error
    }
  }

  /**
   * Update message
   */
  static async update(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          ...updates,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error updating message:', error)
      throw error
    }
  }

  /**
   * Delete message (soft delete)
   */
  static async delete(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  /**
   * Search messages
   */
  static async search(chatId: string, query: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error searching messages:', error)
      throw error
    }
  }
}

// ============================================================================
// CHAT PARTICIPANT MODEL
// ============================================================================

export class ChatParticipantModel {
  /**
   * Add participant to chat
   */
  static async create(participantData: Partial<ChatParticipant>): Promise<ChatParticipant> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: participantData.chat_id,
          user_id: participantData.user_id,
          role: participantData.role || 'member',
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString(),
          is_active: true,
          is_muted: false,
          muted_until: null,
          custom_name: participantData.custom_name || null
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error adding participant:', error)
      throw error
    }
  }

  /**
   * Get chat participants
   */
  static async getParticipants(chatId: string): Promise<ChatParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting participants:', error)
      throw error
    }
  }

  /**
   * Update participant role
   */
  static async updateRole(
    chatId: string,
    userId: string,
    role: ParticipantRole
  ): Promise<ChatParticipant> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({ role })
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error updating participant role:', error)
      throw error
    }
  }

  /**
   * Remove participant from chat
   */
  static async remove(chatId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ is_active: false })
        .eq('chat_id', chatId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error removing participant:', error)
      throw error
    }
  }

  /**
   * Mute participant
   */
  static async mute(
    chatId: string,
    userId: string,
    mutedUntil?: string
  ): Promise<ChatParticipant> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({
          is_muted: true,
          muted_until: mutedUntil || null
        })
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error muting participant:', error)
      throw error
    }
  }

  /**
   * Unmute participant
   */
  static async unmute(chatId: string, userId: string): Promise<ChatParticipant> {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({
          is_muted: false,
          muted_until: null
        })
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error unmuting participant:', error)
      throw error
    }
  }

  /**
   * Update last read timestamp
   */
  static async updateLastRead(chatId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error updating last read:', error)
      throw error
    }
  }
}
