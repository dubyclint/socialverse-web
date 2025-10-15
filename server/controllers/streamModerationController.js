// server/controllers/streamModerationController.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export class StreamModerationController {
  // Chat moderation with content filtering
  async moderateMessage(streamId, userId, message) {
    try {
      const moderationResult = await this.analyzeMessage(message)
      
      if (moderationResult.blocked) {
        // Log moderation action
        await supabase
          .from('moderation_logs')
          .insert({
            stream_id: streamId,
            user_id: userId,
            action: 'message_blocked',
            reason: moderationResult.reason,
            content: message,
            timestamp: new Date().toISOString()
          })

        return {
          allowed: false,
          reason: moderationResult.reason,
          filteredMessage: moderationResult.filteredMessage
        }
      }

      return {
        allowed: true,
        message: moderationResult.filteredMessage || message
      }
    } catch (error) {
      return { allowed: false, error: error.message }
    }
  }

  // Block/ban users from stream
  async blockUser(streamId, streamerId, targetUserId, reason, duration = null) {
    try {
      const blockData = {
        stream_id: streamId,
        streamer_id: streamerId,
        blocked_user_id: targetUserId,
        reason,
        blocked_at: new Date().toISOString(),
        expires_at: duration ? new Date(Date.now() + duration * 1000).toISOString() : null,
        is_permanent: !duration
      }

      await supabase
        .from('stream_blocks')
        .insert(blockData)

      // Remove user from active viewers
      await supabase
        .from('active_stream_viewers')
        .delete()
        .eq('stream_id', streamId)
        .eq('user_id', targetUserId)

      // Log moderation action
      await supabase
        .from('moderation_logs')
        .insert({
          stream_id: streamId,
          user_id: streamerId,
          target_user_id: targetUserId,
          action: duration ? 'user_banned' : 'user_blocked',
          reason,
          metadata: { duration },
          timestamp: new Date().toISOString()
        })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Unblock user
  async unblockUser(streamId, streamerId, targetUserId) {
    try {
      await supabase
        .from('stream_blocks')
        .update({ unblocked_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('blocked_user_id', targetUserId)
        .is('unblocked_at', null)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Set stream privacy controls
  async updatePrivacySettings(streamId, settings) {
    try {
      const privacySettings = {
        is_private: settings.isPrivate || false,
        require_approval: settings.requireApproval || false,
        allowed_viewers: settings.allowedViewers || [],
        blocked_countries: settings.blockedCountries || [],
        age_restriction: settings.ageRestriction || null,
        chat_mode: settings.chatMode || 'open', // open, followers_only, subscribers_only
        updated_at: new Date().toISOString()
      }

      await supabase
        .from('stream_privacy_settings')
        .upsert({
          stream_id: streamId,
          ...privacySettings
        })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Check if user can access stream
  async checkStreamAccess(streamId, userId, userCountry = null) {
    try {
      const { data: settings } = await supabase
        .from('stream_privacy_settings')
        .select('*')
        .eq('stream_id', streamId)
        .single()

      if (!settings) {
        return { allowed: true } // No restrictions
      }

      // Check if user is blocked
      const { data: block } = await supabase
        .from('stream_blocks')
        .select('*')
        .eq('stream_id', streamId)
        .eq('blocked_user_id', userId)
        .is('unblocked_at', null)
        .single()

      if (block) {
        const isExpired = block.expires_at && new Date(block.expires_at) < new Date()
        if (!isExpired) {
          return { allowed: false, reason: 'User is blocked from this stream' }
        }
      }

      // Check country restrictions
      if (settings.blocked_countries?.includes(userCountry)) {
        return { allowed: false, reason: 'Stream not available in your country' }
      }

      // Check private stream access
      if (settings.is_private && !settings.allowed_viewers?.includes(userId)) {
        return { allowed: false, reason: 'This is a private stream' }
      }

      return { allowed: true }
    } catch (error) {
      return { allowed: false, error: error.message }
    }
  }

  // Content filtering using keyword detection and AI
  async analyzeMessage(message) {
    const bannedWords = [
      // Add your banned words list
      'spam', 'scam', 'hate', 'toxic'
    ]

    const lowerMessage = message.toLowerCase()
    let filteredMessage = message
    let blocked = false
    let reason = ''

    // Check for banned words
    for (const word of bannedWords) {
      if (lowerMessage.includes(word)) {
        blocked = true
        reason = 'Contains inappropriate content'
        filteredMessage = message.replace(new RegExp(word, 'gi'), '***')
      }
    }

    // Check for excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length
    if (capsRatio > 0.7 && message.length > 10) {
      reason = 'Excessive caps usage'
      filteredMessage = message.toLowerCase()
    }

    // Check for spam patterns (repeated characters)
    if (/(.)\1{4,}/.test(message)) {
      blocked = true
      reason = 'Spam detected'
    }

    return { blocked, reason, filteredMessage }
  }

  // Get moderation dashboard data
  async getModerationDashboard(streamId) {
    try {
      const [blockedUsers, moderationLogs, chatStats] = await Promise.all([
        this.getBlockedUsers(streamId),
        this.getModerationLogs(streamId),
        this.getChatStatistics(streamId)
      ])

      return {
        success: true,
        dashboard: {
          blockedUsers,
          recentActions: moderationLogs,
          chatStatistics: chatStats
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getBlockedUsers(streamId) {
    const { data } = await supabase
      .from('stream_blocks')
      .select('blocked_user_id, reason, blocked_at, expires_at')
      .eq('stream_id', streamId)
      .is('unblocked_at', null)

    return data || []
  }

  async getModerationLogs(streamId, limit = 50) {
    const { data } = await supabase
      .from('moderation_logs')
      .select('*')
      .eq('stream_id', streamId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    return data || []
  }
}
