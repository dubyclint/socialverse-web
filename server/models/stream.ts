// server/models/stream.ts
// ============================================================================
// CONSOLIDATED STREAM MODELS
// Merges: Stream.js + stream-chat.js + stream-viewer.js + stream-pewgift.js
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type StreamStatus = 'scheduled' | 'live' | 'ended' | 'paused'
export type StreamChatMessageType = 'text' | 'pewgift' | 'reaction' | 'system' | 'moderator'

export interface Stream {
  id: string
  stream_id: string
  user_id: string
  title: string
  description?: string
  status: StreamStatus
  viewer_count: number
  peak_viewers: number
  total_views: number
  start_time?: string
  end_time?: string
  scheduled_time?: string
  duration: number
  is_recorded: boolean
  recording_url?: string
  thumbnail_url?: string
  category?: string
  tags?: string[]
  is_live: boolean
  created_at: string
  updated_at: string
}

export interface StreamChat {
  id: string
  stream_id: string
  user_id: string
  username: string
  message: string
  message_type: StreamChatMessageType
  timestamp: string
  is_deleted: boolean
  deleted_by?: string
  deleted_at?: string
  is_pinned: boolean
  pinned_by?: string
  reactions?: Record<string, string[]>
}

export interface StreamViewer {
  id: string
  stream_id: string
  user_id: string
  username: string
  joined_at: string
  left_at?: string
  watch_duration: number
  is_active: boolean
}

export interface StreamPewGift {
  id: string
  stream_id: string
  sender_id: string
  sender_name: string
  gift_id: string
  gift_name: string
  gift_value: number
  quantity: number
  message?: string
  timestamp: string
}

// ============================================================================
// STREAM MODEL
// ============================================================================

export class StreamModel {
  /**
   * Create a new stream
   */
  static async create(streamData: Partial<Stream>): Promise<Stream> {
    try {
      const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const { data, error } = await supabase
        .from('streams')
        .insert({
          stream_id: streamId,
          user_id: streamData.user_id,
          title: streamData.title,
          description: streamData.description || null,
          status: streamData.status || 'scheduled',
          viewer_count: 0,
          peak_viewers: 0,
          total_views: 0,
          start_time: streamData.start_time || null,
          end_time: streamData.end_time || null,
          scheduled_time: streamData.scheduled_time || null,
          duration: 0,
          is_recorded: streamData.is_recorded !== false,
          recording_url: null,
          thumbnail_url: streamData.thumbnail_url || null,
          category: streamData.category || null,
          tags: streamData.tags || [],
          is_live: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating stream:', error)
      throw error
    }
  }

  /**
   * Get stream by ID
   */
  static async getById(streamId: string): Promise<Stream | null> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('stream_id', streamId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting stream:', error)
      throw error
    }
  }

  /**
   * Update stream
   */
  static async update(streamId: string, updates: Partial<Stream>): Promise<Stream> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('stream_id', streamId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error updating stream:', error)
      throw error
    }
  }

  /**
   * Get user's streams
   */
  static async getUserStreams(userId: string, limit: number = 50): Promise<Stream[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting user streams:', error)
      throw error
    }
  }

  /**
   * Get live streams
   */
  static async getLiveStreams(limit: number = 50): Promise<Stream[]> {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'live')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting live streams:', error)
      throw error
    }
  }

  /**
   * End stream
   */
  static async endStream(streamId: string): Promise<Stream> {
    try {
      const now = new Date().toISOString()
      const stream = await this.getById(streamId)

      if (!stream) throw new Error('Stream not found')

      const duration = stream.start_time
        ? Math.floor((new Date(now).getTime() - new Date(stream.start_time).getTime()) / 1000)
        : 0

      const { data, error } = await supabase
        .from('streams')
        .update({
          status: 'ended',
          is_live: false,
          end_time: now,
          duration,
          updated_at: now
        })
        .eq('stream_id', streamId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error ending stream:', error)
      throw error
    }
  }
}

// ============================================================================
// STREAM CHAT MODEL
// ============================================================================

export class StreamChatModel {
  /**
   * Create a chat message
   */
  static async create(messageData: Partial<StreamChat>): Promise<StreamChat> {
    try {
      const { data, error } = await supabase
        .from('stream_chats')
        .insert({
          stream_id: messageData.stream_id,
          user_id: messageData.user_id,
          username: messageData.username,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          timestamp: new Date().toISOString(),
          is_deleted: false,
          is_pinned: false,
          reactions: {}
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating stream chat message:', error)
      throw error
    }
  }

  /**
   * Get stream chat messages
   */
  static async getMessages(streamId: string, limit: number = 100): Promise<StreamChat[]> {
    try {
      const { data, error } = await supabase
        .from('stream_chats')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_deleted', false)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting stream chat messages:', error)
      throw error
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string, deletedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('stream_chats')
        .update({
          is_deleted: true,
          deleted_by: deletedBy,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting stream chat message:', error)
      throw error
    }
  }

  /**
   * Pin message
   */
  static async pinMessage(messageId: string, pinnedBy: string): Promise<StreamChat> {
    try {
      const { data, error } = await supabase
        .from('stream_chats')
        .update({
          is_pinned: true,
          pinned_by: pinnedBy
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error pinning message:', error)
      throw error
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const message = await supabase
        .from('stream_chats')
        .select('reactions')
        .eq('id', messageId)
        .single()

      const reactions = message.data?.reactions || {}
      if (!reactions[emoji]) reactions[emoji] = []
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId)
      }

      const { error } = await supabase
        .from('stream_chats')
        .update({ reactions })
        .eq('id', messageId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error adding reaction:', error)
      throw error
    }
  }
}

// ============================================================================
// STREAM VIEWER MODEL
// ============================================================================

export class StreamViewerModel {
  /**
   * Add viewer to stream
   */
  static async addViewer(viewerData: Partial<StreamViewer>): Promise<StreamViewer> {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .insert({
          stream_id: viewerData.stream_id,
          user_id: viewerData.user_id,
          username: viewerData.username,
          joined_at: new Date().toISOString(),
          watch_duration: 0,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error adding viewer:', error)
      throw error
    }
  }

  /**
   * Remove viewer from stream
   */
  static async removeViewer(streamId: string, userId: string): Promise<void> {
    try {
      const viewer = await supabase
        .from('stream_viewers')
        .select('joined_at')
        .eq('stream_id', streamId)
        .eq('user_id', userId)
        .single()

      const watchDuration = viewer.data?.joined_at
        ? Math.floor((new Date().getTime() - new Date(viewer.data.joined_at).getTime()) / 1000)
        : 0

      const { error } = await supabase
        .from('stream_viewers')
        .update({
          is_active: false,
          left_at: new Date().toISOString(),
          watch_duration: watchDuration
        })
        .eq('stream_id', streamId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error removing viewer:', error)
      throw error
    }
  }

  /**
   * Get active viewers
   */
  static async getActiveViewers(streamId: string): Promise<StreamViewer[]> {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting active viewers:', error)
      throw error
    }
  }

  /**
   * Get viewer count
   */
  static async getViewerCount(streamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('stream_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .eq('is_active', true)

      if (error) throw error
      return count || 0
    } catch (error: any) {
      console.error('Error getting viewer count:', error)
      throw error
    }
  }
}

// ============================================================================
// STREAM PEWGIFT MODEL
// ============================================================================

export class StreamPewGiftModel {
  /**
   * Create a pewgift transaction
   */
  static async create(giftData: Partial<StreamPewGift>): Promise<StreamPewGift> {
    try {
      const { data, error } = await supabase
        .from('stream_pewgifts')
        .insert({
          stream_id: giftData.stream_id,
          sender_id: giftData.sender_id,
          sender_name: giftData.sender_name,
          gift_id: giftData.gift_id,
          gift_name: giftData.gift_name,
          gift_value: giftData.gift_value,
          quantity: giftData.quantity || 1,
          message: giftData.message || null,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating stream pewgift:', error)
      throw error
    }
  }

  /**
   * Get stream pewgifts
   */
  static async getGifts(streamId: string, limit: number = 100): Promise<StreamPewGift[]> {
    try {
      const { data, error } = await supabase
        .from('stream_pewgifts')
        .select('*')
        .eq('stream_id', streamId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting stream pewgifts:', error)
      throw error
    }
  }

  /**
   * Get total pewgift value for stream
   */
  static async getTotalValue(streamId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('stream_pewgifts')
        .select('gift_value, quantity')
        .eq('stream_id', streamId)

      if (error) throw error

      const total = (data || []).reduce((sum, gift) => sum + gift.gift_value * gift.quantity, 0)
      return total
    } catch (error: any) {
      console.error('Error getting total pewgift value:', error)
      throw error
    }
  }

  /**
   * Get top gifters
   */
  static async getTopGifters(streamId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('stream_pewgifts')
        .select('sender_id, sender_name, gift_value, quantity')
        .eq('stream_id', streamId)

      if (error) throw error

      const gifters = (data || []).reduce((acc: any, gift) => {
        const existing = acc.find((g: any) => g.sender_id === gift.sender_id)
        if (existing) {
          existing.total_value += gift.gift_value * gift.quantity
          existing.gift_count += 1
        } else {
          acc.push({
            sender_id: gift.sender_id,
            sender_name: gift.sender_name,
            total_value: gift.gift_value * gift.quantity,
            gift_count: 1
          })
        }
        return acc
      }, [])

      return gifters.sort((a, b) => b.total_value - a.total_value).slice(0, limit)
    } catch (error: any) {
      console.error('Error getting top gifters:', error)
      throw error
    }
  }
}
