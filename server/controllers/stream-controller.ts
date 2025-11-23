// server/controllers/stream-controller.ts
// ============================================================================
// CONSOLIDATED STREAM CONTROLLER
// Merges: stream-controller.js + stream-analytics-controller.js + 
//         stream-moderation-controller.js + stream-recording-controller.js
// ============================================================================

import { StreamModel, StreamChatModel, StreamViewerModel, StreamPewGiftModel } from '~/server/models/stream'
import { supabase } from '~/server/utils/database'
import type { H3Event } from 'h3'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StreamAnalyticsEvent {
  stream_id: string
  user_id: string
  event_type: 'viewer_joined' | 'viewer_left' | 'message_sent' | 'gift_sent'
  metadata?: Record<string, any>
}

export interface ModerationResult {
  allowed: boolean
  reason?: string
  filteredMessage?: string
}

export interface StreamMetrics {
  current_viewers: number
  peak_viewers: number
  total_views: number
  average_watch_time: number
  engagement_rate: number
}

// ============================================================================
// STREAM CONTROLLER
// ============================================================================

export class StreamController {
  /**
   * Create a new stream
   */
  static async createStream(event: H3Event) {
    try {
      const body = await readBody(event)
      const { title, description, category, tags, scheduledTime, isRecorded } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      // Validate required fields
      if (!title || title.trim().length === 0) {
        throw createError({ statusCode: 400, statusMessage: 'Stream title is required' })
      }

      // Check if user already has an active stream
      const existingStream = await StreamModel.getUserStreams(userId, 1)
      const activeStream = existingStream.find(s => ['live', 'scheduled'].includes(s.status))

      if (activeStream) {
        throw createError({
          statusCode: 400,
          statusMessage: 'You already have an active or scheduled stream'
        })
      }

      // Create stream
      const stream = await StreamModel.create({
        user_id: userId,
        title,
        description,
        category,
        tags,
        scheduled_time: scheduledTime,
        is_recorded: isRecorded !== false
      })

      return { success: true, data: stream }
    } catch (error: any) {
      console.error('Error creating stream:', error)
      throw error
    }
  }

  /**
   * Start stream (go live)
   */
  static async startStream(event: H3Event) {
    try {
      const body = await readBody(event)
      const { streamId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const stream = await StreamModel.getById(streamId)
      if (!stream) {
        throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
      }

      if (stream.user_id !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
      }

      // Update stream status
      const updatedStream = await StreamModel.update(streamId, {
        status: 'live',
        is_live: true,
        start_time: new Date().toISOString()
      })

      // Track analytics event
      await this.trackAnalyticsEvent({
        stream_id: streamId,
        user_id: userId,
        event_type: 'viewer_joined',
        metadata: { action: 'stream_started' }
      })

      return { success: true, data: updatedStream }
    } catch (error: any) {
      console.error('Error starting stream:', error)
      throw error
    }
  }

  /**
   * End stream
   */
  static async endStream(event: H3Event) {
    try {
      const body = await readBody(event)
      const { streamId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const stream = await StreamModel.getById(streamId)
      if (!stream) {
        throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
      }

      if (stream.user_id !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
      }

      // End stream
      const updatedStream = await StreamModel.endStream(streamId)

      return { success: true, data: updatedStream }
    } catch (error: any) {
      console.error('Error ending stream:', error)
      throw error
    }
  }

  /**
   * Get stream details
   */
  static async getStream(event: H3Event) {
    try {
      const { streamId } = getRouterParams(event)

      const stream = await StreamModel.getById(streamId)
      if (!stream) {
        throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
      }

      return { success: true, data: stream }
    } catch (error: any) {
      console.error('Error getting stream:', error)
      throw error
    }
  }

  /**
   * Get user's streams
   */
  static async getUserStreams(event: H3Event) {
    try {
      const userId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const streams = await StreamModel.getUserStreams(userId, limit)

      return { success: true, data: streams }
    } catch (error: any) {
      console.error('Error getting user streams:', error)
      throw error
    }
  }

  /**
   * Get live streams
   */
  static async getLiveStreams(event: H3Event) {
    try {
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      const streams = await StreamModel.getLiveStreams(limit)

      return { success: true, data: streams }
    } catch (error: any) {
      console.error('Error getting live streams:', error)
      throw error
    }
  }

  // ============================================================================
  // STREAM CHAT METHODS
  // ============================================================================

  /**
   * Send chat message
   */
  static async sendChatMessage(event: H3Event) {
    try {
      const body = await readBody(event)
      const { streamId, message } = body
      const userId = event.context.user?.id
      const username = event.context.user?.username

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      // Moderate message
      const moderation = await this.moderateMessage(streamId, userId, message)
      if (!moderation.allowed) {
        throw createError({
          statusCode: 400,
          statusMessage: moderation.reason || 'Message blocked by moderation'
        })
      }

      // Create message
      const chatMessage = await StreamChatModel.create({
        stream_id: streamId,
        user_id: userId,
        username,
        message: moderation.filteredMessage || message,
        message_type: 'text'
      })

      // Track analytics
      await this.trackAnalyticsEvent({
        stream_id: streamId,
        user_id: userId,
        event_type: 'message_sent'
      })

      return { success: true, data: chatMessage }
    } catch (error: any) {
      console.error('Error sending chat message:', error)
      throw error
    }
  }

  /**
   * Get stream chat messages
   */
  static async getStreamChat(event: H3Event) {
    try {
      const { streamId } = getRouterParams(event)
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 100

      const messages = await StreamChatModel.getMessages(streamId, limit)

      return { success: true, data: messages }
    } catch (error: any) {
      console.error('Error getting stream chat:', error)
      throw error
    }
  }

  /**
   * Delete chat message
   */
  static async deleteMessage(event: H3Event) {
    try {
      const body = await readBody(event)
      const { messageId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await StreamChatModel.deleteMessage(messageId, userId)

      return { success: true, message: 'Message deleted' }
    } catch (error: any) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  /**
   * Pin message
   */
  static async pinMessage(event: H3Event) {
    try {
      const body = await readBody(event)
      const { messageId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const message = await StreamChatModel.pinMessage(messageId, userId)

      return { success: true, data: message }
    } catch (error: any) {
      console.error('Error pinning message:', error)
      throw error
    }
  }

  // ============================================================================
  // STREAM VIEWER METHODS
  // ============================================================================

  /**
   * Add viewer to stream
   */
  static async addViewer(event: H3Event) {
    try {
      const body = await readBody(event)
      const { streamId } = body
      const userId = event.context.user?.id
      const username = event.context.user?.username

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const viewer = await StreamViewerModel.addViewer({
        stream_id: streamId,
        user_id: userId,
        username
      })

      // Track analytics
      await this.trackAnalyticsEvent({
        stream_id: streamId,
        user_id: userId,
        event_type: 'viewer_joined'
      })

      return { success: true, data: viewer }
    } catch (error: any) {
      console.error('Error adding viewer:', error)
      throw error
    }
  }

  /**
   * Remove viewer from stream
   */
  static async removeViewer(event: H3Event) {
    try {
      const body = await readBody(event)
      const { streamId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await StreamViewerModel.removeViewer(streamId, userId)

      // Track analytics
      await this.trackAnalyticsEvent({
        stream_id: streamId,
        user_id: userId,
        event_type: 'viewer_left'
      })

      return { success: true, message: 'Viewer removed' }
    } catch (error: any) {
      console.error('Error removing viewer:', error)
      throw error
    }
  }

  /**
   * Get active viewers
   */
  static async getActiveViewers(event: H3Event) {
    try {
      const { streamId } = getRouterParams(event)

      const viewers = await StreamViewerModel.getActiveViewers(streamId)
      const count = viewers.length

      return { success: true, data: { viewers, count } }
    } catch (error: any) {
      console.error('Error getting active viewers:', error)
      throw error
    }
  }

  /**
   * Get viewer count
   */
  static async getViewerCount(event: H3Event) {
    try {
      const { streamId } = getRouterParams(event)

      const count = await StreamViewerModel.getViewerCount(streamId)

      return { success: true, data: { count } }
    } catch (error: any) {
      console.error('Error getting viewer count:', error)
      throw error
    }
  }

  // ============================================================================
  // STREAM PEWGIFT METHODS
  // ============================================================================

  /**
   * Send pewgift
   */
  static async sendPewGift(event: H3Event) {
    try {
      const body = await readBody(event)
      const { streamId, giftId, giftName, giftValue, quantity, message } = body
      const senderId = event.context.user?.id
      const senderName = event.context.user?.username

      if (!senderId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const gift = await StreamPewGiftModel.create({
        stream_id: streamId,
        sender_id: senderId,
        sender_name: senderName,
        gift_id: giftId,
        gift_name: giftName,
        gift_value: giftValue,
        quantity: quantity || 1,
        message
      })

      // Track analytics
      await this.trackAnalyticsEvent({
        stream_id: streamId,
        user_id: senderId,
        event_type: 'gift_sent',
        metadata: { gift_value: giftValue, quantity }
      })

      return { success: true, data: gift }
    } catch (error: any) {
      console.error('Error sending pewgift:', error)
      throw error
    }
  }

  /**
   * Get stream pewgifts
   */
  static async getStreamGifts(event: H3Event) {
    try {
      const { streamId } = getRouterParams(event)
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 100

      const gifts = await StreamPewGiftModel.getGifts(streamId, limit)

      return { success: true, data: gifts }
    } catch (error: any) {
      console.error('Error getting stream gifts:', error)
      throw error
    }
  }

  /**
   * Get top gifters
   */
  static async getTopGifters(event: H3Event) {
    try {
      const { streamId } = getRouterParams(event)
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 10

      const topGifters = await StreamPewGiftModel.getTopGifters(streamId, limit)

      return { success: true, data: topGifters }
    } catch (error: any) {
      console.error('Error getting top gifters:', error)
      throw error
    }
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  /**
   * Track analytics event
   */
  static async trackAnalyticsEvent(eventData: StreamAnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('stream_analytics_events')
        .insert({
          stream_id: eventData.stream_id,
          user_id: eventData.user_id,
          event_type: eventData.event_type,
          metadata: eventData.metadata || {},
          timestamp: new Date().toISOString()
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Error tracking analytics event:', error)
    }
  }

  /**
   * Get stream metrics
   */
  static async getStreamMetrics(event: H3Event): Promise<any> {
    try {
      const { streamId } = getRouterParams(event)

      const stream = await StreamModel.getById(streamId)
      if (!stream) {
        throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
      }

      const viewers = await StreamViewerModel.getActiveViewers(streamId)
      const totalGiftValue = await StreamPewGiftModel.getTotalValue(streamId)

      const metrics: StreamMetrics = {
        current_viewers: viewers.length,
        peak_viewers: stream.peak_viewers,
        total_views: stream.total_views,
        average_watch_time: 0,
        engagement_rate: 0
      }

      return { success: true, data: metrics }
    } catch (error: any) {
      console.error('Error getting stream metrics:', error)
      throw error
    }
  }

  /**
   * Get analytics dashboard
   */
  static async getAnalyticsDashboard(event: H3Event): Promise<any> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const streams = await StreamModel.getUserStreams(userId, 100)

      const { data: events, error } = await supabase
        .from('stream_analytics_events')
        .select('*')
        .in('stream_id', streams.map(s => s.stream_id))
        .order('timestamp', { ascending: false })

      if (error) throw error

      return { success: true, data: { streams, events } }
    } catch (error: any) {
      console.error('Error getting analytics dashboard:', error)
      throw error
    }
  }

  // ============================================================================
  // MODERATION METHODS
  // ============================================================================

  /**
   * Moderate message
   */
  static async moderateMessage(
    streamId: string,
    userId: string,
    message: string
  ): Promise<ModerationResult> {
    try {
      // Check for blocked words/patterns
      const blockedPatterns = [
        /hate/gi,
        /spam/gi,
        /abuse/gi,
        /violence/gi
      ]

      let filteredMessage = message
      let isBlocked = false

      for (const pattern of blockedPatterns) {
        if (pattern.test(message)) {
          isBlocked = true
          filteredMessage = message.replace(pattern, '***')
        }
      }

      if (isBlocked) {
        // Log moderation action
        await supabase
          .from('moderation_logs')
          .insert({
            stream_id: streamId,
            user_id: userId,
            action: 'message_filtered',
            content: message,
            timestamp: new Date().toISOString()
          })

        return {
          allowed: true,
          filteredMessage
        }
      }

      return { allowed: true }
    } catch (error: any) {
      console.error('Error moderating message:', error)
      return { allowed: true }
    }
  }

  /**
   * Ban user from stream
   */
  static async banUserFromStream(event: H3Event): Promise<any> {
    try {
      const body = await readBody(event)
      const { streamId, userId, reason } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      // Remove viewer
      await StreamViewerModel.removeViewer(streamId, userId)

      // Log ban
      await supabase
        .from('moderation_logs')
        .insert({
          stream_id: streamId,
          user_id: userId,
          action: 'user_banned',
          reason,
          admin_id: adminId,
          timestamp: new Date().toISOString()
        })

      return { success: true, message: 'User banned from stream' }
    } catch (error: any) {
      console.error('Error banning user:', error)
      throw error
    }
  }
}
