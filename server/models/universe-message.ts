// FILE: /server/models/universe-message.ts
// Universe Message Management
// Converted from: /server/universe-message.js

import { db } from '~/server/utils/database'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UniverseMessage {
  id: string
  sender_id: string
  country: string
  interest_tags: string[]
  message: string
  is_anonymous: boolean
  room_id: string
  message_type: 'text' | 'media' | 'reaction'
  media_url?: string
  reply_to?: string
  is_pinned: boolean
  is_reported: boolean
  created_at: string
  updated_at: string
}

export interface CreateUniverseMessageInput {
  senderId: string
  country: string
  interestTags?: string[]
  message: string
  isAnonymous?: boolean
  roomId?: string
  messageType?: 'text' | 'media' | 'reaction'
  mediaUrl?: string
  replyTo?: string
}

// ============================================================================
// UNIVERSE MESSAGE MODEL
// ============================================================================

export class UniverseMessageModel {
  /**
   * Create a new universe message
   */
  static async create(input: CreateUniverseMessageInput): Promise<UniverseMessage> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .insert({
          sender_id: input.senderId,
          country: input.country,
          interest_tags: input.interestTags || [],
          message: input.message,
          is_anonymous: input.isAnonymous || false,
          room_id: input.roomId || 'global',
          message_type: input.messageType || 'text',
          media_url: input.mediaUrl,
          reply_to: input.replyTo,
          is_pinned: false,
          is_reported: false
        })
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Create error:', error)
      throw error
    }
  }

  /**
   * Get message by ID
   */
  static async getById(messageId: string): Promise<UniverseMessage | null> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .eq('id', messageId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UniverseMessage) || null
    } catch (error) {
      console.error('[UniverseMessageModel] Get by ID error:', error)
      throw error
    }
  }

  /**
   * Get messages from a room
   */
  static async getRoomMessages(roomId: string = 'global', limit: number = 50): Promise<UniverseMessage[]> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .eq('room_id', roomId)
        .eq('is_reported', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as UniverseMessage[]) || []
    } catch (error) {
      console.error('[UniverseMessageModel] Get room messages error:', error)
      throw error
    }
  }

  /**
   * Get messages by interest tags
   */
  static async getByInterestTags(tags: string[], limit: number = 50): Promise<UniverseMessage[]> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .contains('interest_tags', tags)
        .eq('is_reported', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as UniverseMessage[]) || []
    } catch (error) {
      console.error('[UniverseMessageModel] Get by interest tags error:', error)
      throw error
    }
  }

  /**
   * Get messages by country
   */
  static async getByCountry(country: string, limit: number = 50): Promise<UniverseMessage[]> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .eq('country', country)
        .eq('is_reported', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as UniverseMessage[]) || []
    } catch (error) {
      console.error('[UniverseMessageModel] Get by country error:', error)
      throw error
    }
  }

  /**
   * Update message
   */
  static async update(messageId: string, senderId: string, updates: Partial<CreateUniverseMessageInput>): Promise<UniverseMessage> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', senderId)
        .select()
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Update error:', error)
      throw error
    }
  }

  /**
   * Delete message
   */
  static async delete(messageId: string, senderId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from('universe_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', senderId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[UniverseMessageModel] Delete error:', error)
      throw error
    }
  }

  /**
   * Report message
   */
  static async reportMessage(messageId: string, reason: string): Promise<UniverseMessage> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .update({
          is_reported: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Report message error:', error)
      throw error
    }
  }

  /**
   * Pin message
   */
  static async pinMessage(messageId: string): Promise<UniverseMessage> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .update({
          is_pinned: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return data as UniverseMessage
    } catch (error) {
      console.error('[UniverseMessageModel] Pin message error:', error)
      throw error
    }
  }

  /**
   * Get pinned messages
   */
  static async getPinnedMessages(roomId: string = 'global'): Promise<UniverseMessage[]> {
    try {
      const { data, error } = await db
        .from('universe_messages')
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .eq('room_id', roomId)
        .eq('is_pinned', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as UniverseMessage[]) || []
    } catch (error) {
      console.error('[UniverseMessageModel] Get pinned messages error:', error)
      throw error
    }
  }

  /**
   * Search messages
   */
  static async search(query: string, roomId?: string, limit: number = 50): Promise<UniverseMessage[]> {
    try {
      let queryBuilder = db
        .from('universe_messages')
        .select(
          `
          *,
          sender:sender_id(id, username, avatar_url, country),
          reply_message:reply_to(id, message, sender_id)
        `
        )
        .ilike('message', `%${query}%`)
        .eq('is_reported', false)

      if (roomId) {
        queryBuilder = queryBuilder.eq('room_id', roomId)
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as UniverseMessage[]) || []
    } catch (error) {
      console.error('[UniverseMessageModel] Search error:', error)
      throw error
    }
  }
}
