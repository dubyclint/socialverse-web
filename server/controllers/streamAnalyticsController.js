// server/controllers/streamAnalyticsController.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export class StreamAnalyticsController {
  // Track viewer join/leave events
  async trackViewerEvent(streamId, userId, event, metadata = {}) {
    try {
      await supabase
        .from('stream_analytics_events')
        .insert({
          stream_id: streamId,
          user_id: userId,
          event_type: event,
          metadata,
          timestamp: new Date().toISOString()
        })

      // Update real-time viewer count
      if (event === 'viewer_joined') {
        await this.incrementViewerCount(streamId)
      } else if (event === 'viewer_left') {
        await this.decrementViewerCount(streamId)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get real-time stream metrics
  async getRealtimeMetrics(streamId) {
    try {
      const [viewerCount, chatActivity, giftRevenue] = await Promise.all([
        this.getCurrentViewerCount(streamId),
        this.getChatActivity(streamId),
        this.getGiftRevenue(streamId)
      ])

      return {
        success: true,
        metrics: {
          currentViewers: viewerCount,
          chatMessagesPerMinute: chatActivity.messagesPerMinute,
          totalChatMessages: chatActivity.totalMessages,
          giftRevenue: giftRevenue.total,
          topGifters: giftRevenue.topGifters
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get comprehensive stream performance analytics
  async getStreamPerformance(streamId) {
    try {
      const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single()

      const [viewerStats, engagementStats, revenueStats] = await Promise.all([
        this.getViewerStatistics(streamId),
        this.getEngagementStatistics(streamId),
        this.getRevenueStatistics(streamId)
      ])

      return {
        success: true,
        performance: {
          stream,
          viewers: viewerStats,
          engagement: engagementStats,
          revenue: revenueStats
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Track PewGift transactions and revenue
  async trackPewGiftRevenue(streamId, gifterId, receiverId, giftType, amount) {
    try {
      const revenueData = {
        stream_id: streamId,
        gifter_id: gifterId,
        receiver_id: receiverId,
        gift_type: giftType,
        amount,
        timestamp: new Date().toISOString()
      }

      await supabase
        .from('stream_gift_revenue')
        .insert(revenueData)

      // Update real-time revenue tracking
      await this.updateRealtimeRevenue(streamId, amount)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get engagement statistics
  async getEngagementStatistics(streamId) {
    try {
      const { data: events } = await supabase
        .from('stream_analytics_events')
        .select('event_type, timestamp, metadata')
        .eq('stream_id', streamId)

      const engagement = {
        totalInteractions: events.length,
        chatMessages: events.filter(e => e.event_type === 'chat_message').length,
        likes: events.filter(e => e.event_type === 'like').length,
        shares: events.filter(e => e.event_type === 'share').length,
        gifts: events.filter(e => e.event_type === 'gift_sent').length,
        averageWatchTime: this.calculateAverageWatchTime(events),
        peakViewers: await this.getPeakViewers(streamId)
      }

      return engagement
    } catch (error) {
      throw error
    }
  }

  async getCurrentViewerCount(streamId) {
    const { count } = await supabase
      .from('active_stream_viewers')
      .select('*', { count: 'exact' })
      .eq('stream_id', streamId)
    
    return count || 0
  }

  async getChatActivity(streamId) {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    
    const { data: recentMessages, count: totalMessages } = await supabase
      .from('stream_analytics_events')
      .select('*', { count: 'exact' })
      .eq('stream_id', streamId)
      .eq('event_type', 'chat_message')
      .gte('timestamp', oneMinuteAgo)

    return {
      messagesPerMinute: recentMessages?.length || 0,
      totalMessages: totalMessages || 0
    }
  }

  async getGiftRevenue(streamId) {
    const { data: gifts } = await supabase
      .from('stream_gift_revenue')
      .select('amount, gifter_id')
      .eq('stream_id', streamId)

    const total = gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0
    
    // Get top gifters
    const gifterTotals = {}
    gifts?.forEach(gift => {
      gifterTotals[gift.gifter_id] = (gifterTotals[gift.gifter_id] || 0) + gift.amount
    })

    const topGifters = Object.entries(gifterTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, amount]) => ({ userId, amount }))

    return { total, topGifters }
  }
}
