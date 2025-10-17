// server/ws/streaming.ts
import { Server, Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface StreamSocket extends Socket {
  streamId?: string
  userId?: string
  isStreamer?: boolean
}

interface ViewerData {
  userId: string
  socketId: string
  joinedAt: Date
  country?: string
  userAgent?: string
}

interface StreamRoom {
  streamId: string
  viewers: Map<string, ViewerData>
  streamer?: string
  isActive: boolean
  startedAt: Date
  metadata: {
    title?: string
    category?: string
    isRecording?: boolean
  }
}

// In-memory store for active streams
const activeStreams = new Map<string, StreamRoom>()

export function setupStreamingWebSocket(io: Server) {
  const streamingNamespace = io.of('/streaming')
  
  streamingNamespace.on('connection', (socket: StreamSocket) => {
    console.log('Streaming client connected:', socket.id)

    // Join stream room
    socket.on('join-stream', async (data) => {
      try {
        const { streamId, userId, userCountry, isStreamer = false } = data
        
        if (!streamId || !userId) {
          socket.emit('error', { message: 'Missing required parameters' })
          return
        }

        // Check if user is blocked from this stream
        const { data: blockCheck } = await supabase
          .from('stream_blocks')
          .select('*')
          .eq('stream_id', streamId)
          .eq('blocked_user_id', userId)
          .is('unblocked_at', null)
          .single()

        if (blockCheck) {
          const isExpired = blockCheck.expires_at && new Date(blockCheck.expires_at) < new Date()
          if (!isExpired) {
            socket.emit('access-denied', { 
              reason: `You are blocked from this stream: ${blockCheck.reason}` 
            })
            return
          }
        }

        // Check stream privacy settings
        const { data: privacySettings } = await supabase
          .from('stream_privacy_settings')
          .select('*')
          .eq('stream_id', streamId)
          .single()

        if (privacySettings) {
          // Check country restrictions
          if (privacySettings.blocked_countries?.includes(userCountry)) {
            socket.emit('access-denied', { 
              reason: 'Stream not available in your country' 
            })
            return
          }

          // Check private stream access
          if (privacySettings.is_private && !privacySettings.allowed_viewers?.includes(userId)) {
            socket.emit('access-denied', { 
              reason: 'This is a private stream' 
            })
            return
          }
        }

        // Initialize stream room if it doesn't exist
        if (!activeStreams.has(streamId)) {
          activeStreams.set(streamId, {
            streamId,
            viewers: new Map(),
            isActive: true,
            startedAt: new Date(),
            metadata: {}
          })
        }

        const streamRoom = activeStreams.get(streamId)!
        
        // Set socket properties
        socket.streamId = streamId
        socket.userId = userId
        socket.isStreamer = isStreamer

        // Join socket room
        socket.join(`stream-${streamId}`)

        // Add viewer to stream room
        if (!isStreamer) {
          streamRoom.viewers.set(userId, {
            userId,
            socketId: socket.id,
            joinedAt: new Date(),
            country: userCountry,
            userAgent: socket.handshake.headers['user-agent']
          })

          // Track viewer join event in database
          await supabase
            .from('stream_analytics_events')
            .insert({
              stream_id: streamId,
              user_id: userId,
              event_type: 'viewer_joined',
              metadata: {
                socketId: socket.id,
                userAgent: socket.handshake.headers['user-agent'],
                country: userCountry
              },
              timestamp: new Date().toISOString()
            })
        } else {
          streamRoom.streamer = userId
        }

        // Update viewer count in database
        await updateViewerCount(streamId, streamRoom.viewers.size)

        // Broadcast updated viewer count
        const viewerCount = streamRoom.viewers.size
        streamingNamespace.to(`stream-${streamId}`).emit('viewer-count-updated', { 
          count: viewerCount 
        })

        // Send join confirmation
        socket.emit('stream-joined', { 
          streamId, 
          viewerCount,
          isStreamer,
          streamData: streamRoom.metadata
        })

        console.log(`User ${userId} joined stream ${streamId} (${isStreamer ? 'streamer' : 'viewer'})`)

      } catch (error) {
        console.error('Error joining stream:', error)
        socket.emit('error', { message: 'Failed to join stream' })
      }
    })

    // Leave stream room
    socket.on('leave-stream', async () => {
      await handleStreamLeave(socket, streamingNamespace)
    })

    // Handle chat messages with moderation
    socket.on('stream-chat', async (data) => {
      try {
        const { streamId, userId, message, username } = data
        
        if (!streamId || !userId || !message) {
          socket.emit('error', { message: 'Invalid chat message data' })
          return
        }

        // Basic message validation
        if (message.length > 500) {
          socket.emit('message-blocked', { reason: 'Message too long' })
          return
        }

        // Check if user is blocked
        const { data: blockCheck } = await supabase
          .from('stream_blocks')
          .select('*')
          .eq('stream_id', streamId)
          .eq('blocked_user_id', userId)
          .is('unblocked_at', null)
          .single()

        if (blockCheck) {
          socket.emit('message-blocked', { reason: 'You are blocked from chatting' })
          return
        }

        // Moderate message content
        const moderationResult = await moderateMessage(message)
        
        if (!moderationResult.allowed) {
          socket.emit('message-blocked', { reason: moderationResult.reason })
          
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
          return
        }

        const chatMessage = {
          id: `msg_${Date.now()}_${socket.id}`,
          streamId,
          userId,
          username: username || `User${userId.slice(-4)}`,
          message: moderationResult.filteredMessage || message,
          timestamp: new Date().toISOString(),
          type: 'text'
        }

        // Save message to database
        await supabase
          .from('stream_chat')
          .insert({
            stream_id: streamId,
            user_id: userId,
            message: chatMessage.message,
            timestamp: chatMessage.timestamp,
            message_type: 'text'
          })

        // Broadcast to all viewers in stream
        streamingNamespace.to(`stream-${streamId}`).emit('stream-chat', chatMessage)

        // Track analytics event
        await supabase
          .from('stream_analytics_events')
          .insert({
            stream_id: streamId,
            user_id: userId,
            event_type: 'chat_message',
            metadata: {
              messageLength: message.length,
              filtered: moderationResult.filteredMessage !== message
            },
            timestamp: new Date().toISOString()
          })

      } catch (error) {
        console.error('Error handling chat message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle PewGift sending
    socket.on('send-pewgift', async (data) => {
      try {
        const { streamId, gifterId, receiverId, giftType, amount } = data
        
        if (!streamId || !gifterId || !receiverId || !giftType || !amount) {
          socket.emit('error', { message: 'Invalid gift data' })
          return
        }

        // Validate gift amount (minimum $0.01, maximum $100.00)
        if (amount < 1 || amount > 10000) {
          socket.emit('error', { message: 'Invalid gift amount' })
          return
        }

        // Save gift transaction
        const { data: giftRecord } = await supabase
          .from('stream_gift_revenue')
          .insert({
            stream_id: streamId,
            gifter_id: gifterId,
            receiver_id: receiverId,
            gift_type: giftType,
            amount,
            timestamp: new Date().toISOString()
          })
          .select()
          .single()

        const giftMessage = {
          id: `gift_${Date.now()}_${socket.id}`,
          streamId,
          gifterId,
          receiverId,
          giftType,
          amount,
          timestamp: new Date().toISOString(),
          type: 'pewgift'
        }

        // Broadcast gift to all viewers
        streamingNamespace.to(`stream-${streamId}`).emit('pewgift-received', giftMessage)

        // Track analytics event
        await supabase
          .from('stream_analytics_events')
          .insert({
            stream_id: streamId,
            user_id: gifterId,
            event_type: 'gift_sent',
            metadata: {
              giftType,
              amount,
              receiverId
            },
            timestamp: new Date().toISOString()
          })

        // Send confirmation to sender
        socket.emit('gift-sent-confirmation', { giftId: giftRecord?.id })

      } catch (error) {
        console.error('Error handling gift:', error)
        socket.emit('error', { message: 'Failed to send gift' })
      }
    })

    // Handle stream reactions
    socket.on('stream-reaction', async (data) => {
      try {
        const { streamId, userId, reactionType } = data
        
        if (!streamId || !userId || !reactionType) {
          socket.emit('error', { message: 'Invalid reaction data' })
          return
        }

        const reaction = {
          id: `reaction_${Date.now()}_${socket.id}`,
          streamId,
          userId,
          reactionType,
          timestamp: new Date().toISOString()
        }

        // Broadcast reaction to all viewers
        streamingNamespace.to(`stream-${streamId}`).emit('stream-reaction', reaction)

        // Track analytics
        await supabase
          .from('stream_analytics_events')
          .insert({
            stream_id: streamId,
            user_id: userId,
            event_type: 'reaction',
            metadata: { reactionType },
            timestamp: new Date().toISOString()
          })

      } catch (error) {
        console.error('Error handling reaction:', error)
      }
    })

    // Handle streamer actions (moderation)
    socket.on('streamer-action', async (data) => {
      try {
        const { streamId, action, targetUserId, reason, duration } = data
        
        if (!socket.isStreamer) {
          socket.emit('error', { message: 'Unauthorized action' })
          return
        }

        switch (action) {
          case 'block-user':
            await handleUserBlock(streamId, socket.userId!, targetUserId, reason, duration, streamingNamespace)
            break

          case 'unblock-user':
            await handleUserUnblock(streamId, targetUserId)
            break

          case 'clear-chat':
            streamingNamespace.to(`stream-${streamId}`).emit('chat-cleared')
            await logModerationAction(streamId, socket.userId!, 'chat_cleared', reason)
            break

          case 'slow-mode':
            streamingNamespace.to(`stream-${streamId}`).emit('slow-mode-updated', { 
              enabled: data.enabled 
            })
            await logModerationAction(streamId, socket.userId!, 'slow_mode_toggled', `Slow mode ${data.enabled ? 'enabled' : 'disabled'}`)
            break

          case 'end-stream':
            await handleStreamEnd(streamId, streamingNamespace)
            break
        }

      } catch (error) {
        console.error('Error handling streamer action:', error)
        socket.emit('error', { message: 'Failed to execute action' })
      }
    })

    // Handle recording controls
    socket.on('start-recording', async (data) => {
      if (!socket.isStreamer) {
        socket.emit('error', { message: 'Only streamers can control recording' })
        return
      }

      const { streamId } = data
      const streamRoom = activeStreams.get(streamId)
      
      if (streamRoom) {
        streamRoom.metadata.isRecording = true
        socket.emit('recording-started', { streamId })
        streamingNamespace.to(`stream-${streamId}`).emit('recording-status-changed', { 
          isRecording: true 
        })
      }
    })

    socket.on('stop-recording', async (data) => {
      if (!socket.isStreamer) {
        socket.emit('error', { message: 'Only streamers can control recording' })
        return
      }

      const { streamId } = data
      const streamRoom = activeStreams.get(streamId)
      
      if (streamRoom) {
        streamRoom.metadata.isRecording = false
        socket.emit('recording-stopped', { streamId })
        streamingNamespace.to(`stream-${streamId}`).emit('recording-status-changed', { 
          isRecording: false 
        })
      }
    })

    // Handle heartbeat for connection monitoring
    socket.on('heartbeat', (data) => {
      socket.emit('heartbeat-ack', { timestamp: Date.now() })
    })

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`Client ${socket.id} disconnected:`, reason)
      await handleStreamLeave(socket, streamingNamespace)
    })
  })

  // Helper functions
  async function handleStreamLeave(socket: StreamSocket, namespace: any) {
    if (!socket.streamId || !socket.userId) return

    const streamRoom = activeStreams.get(socket.streamId)
    if (!streamRoom) return

    // Remove viewer from stream room
    if (!socket.isStreamer && streamRoom.viewers.has(socket.userId)) {
      const viewerData = streamRoom.viewers.get(socket.userId)!
      streamRoom.viewers.delete(socket.userId)

      // Calculate watch time
      const watchTime = Date.now() - viewerData.joinedAt.getTime()

      // Track viewer leave event
      await supabase
        .from('stream_analytics_events')
        .insert({
          stream_id: socket.streamId,
          user_id: socket.userId,
          event_type: 'viewer_left',
          metadata: {
            watchTime: Math.floor(watchTime / 1000),
            socketId: socket.id
          },
          timestamp: new Date().toISOString()
        })

      // Update viewer count
      await updateViewerCount(socket.streamId, streamRoom.viewers.size)
      
      // Broadcast updated viewer count
      namespace.to(`stream-${socket.streamId}`).emit('viewer-count-updated', { 
        count: streamRoom.viewers.size 
      })
    }

    // If streamer left, end the stream
    if (socket.isStreamer) {
      await handleStreamEnd(socket.streamId, namespace)
    }

    socket.leave(`stream-${socket.streamId}`)
  }

  async function handleUserBlock(
    streamId: string, 
    streamerId: string, 
    targetUserId: string, 
    reason: string, 
    duration: number | null,
    namespace: any
  ) {
    // Add block record to database
    await supabase
      .from('stream_blocks')
      .insert({
        stream_id: streamId,
        streamer_id: streamerId,
        blocked_user_id: targetUserId,
        reason,
        blocked_at: new Date().toISOString(),
        expires_at: duration ? new Date(Date.now() + duration * 1000).toISOString() : null,
        is_permanent: !duration
      })

    // Find and disconnect blocked user
    const blockedSocket = Array.from(namespace.sockets.values())
      .find((s: StreamSocket) => s.userId === targetUserId && s.streamId === streamId)

    if (blockedSocket) {
      blockedSocket.emit('blocked-from-stream', { reason })
      blockedSocket.leave(`stream-${streamId}`)
    }

    // Remove from active viewers
    const streamRoom = activeStreams.get(streamId)
    if (streamRoom && streamRoom.viewers.has(targetUserId)) {
      streamRoom.viewers.delete(targetUserId)
      
      // Update viewer count
      await updateViewerCount(streamId, streamRoom.viewers.size)
      namespace.to(`stream-${streamId}`).emit('viewer-count-updated', { 
        count: streamRoom.viewers.size 
      })
    }

    // Log moderation action
    await logModerationAction(streamId, streamerId, 'user_blocked', reason, targetUserId)
  }

  async function handleUserUnblock(streamId: string, targetUserId: string) {
    await supabase
      .from('stream_blocks')
      .update({ unblocked_at: new Date().toISOString() })
      .eq('stream_id', streamId)
      .eq('blocked_user_id', targetUserId)
      .is('unblocked_at', null)
  }

  async function handleStreamEnd(streamId: string, namespace: any) {
    const streamRoom = activeStreams.get(streamId)
    if (!streamRoom) return

    // Mark stream as inactive
    streamRoom.isActive = false

    // Notify all viewers
    namespace.to(`stream-${streamId}`).emit('stream-ended', {
      streamId,
      endedAt: new Date().toISOString()
    })

    // Update stream record in database
    await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        peak_viewers: Math.max(...Array.from(streamRoom.viewers.values()).map(() => 1))
      })
      .eq('id', streamId)

    // Clean up stream room after a delay
    setTimeout(() => {
      activeStreams.delete(streamId)
    }, 30000) // 30 seconds delay
  }

  async function updateViewerCount(streamId: string, count: number) {
    await supabase
      .from('streams')
      .update({ 
        viewer_count: count,
        peak_viewers: supabase.raw(`GREATEST(peak_viewers, ${count})`)
      })
      .eq('id', streamId)
  }

  async function logModerationAction(
    streamId: string, 
    userId: string, 
    action: string, 
    reason?: string, 
    targetUserId?: string
  ) {
    await supabase
      .from('moderation_logs')
      .insert({
        stream_id: streamId,
        user_id: userId,
        target_user_id: targetUserId,
        action,
        reason,
        timestamp: new Date().toISOString()
      })
  }

  async function moderateMessage(message: string) {
    // Basic content moderation
    const bannedWords = [
      'spam', 'scam', 'hate', 'toxic', 'abuse'
      // Add more banned words as needed
    ]

    const lowerMessage = message.toLowerCase()
    let filteredMessage = message
    let blocked = false
    let reason = ''

    // Check for banned words
    for (const word of bannedWords) {
      if
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

    // Check for URLs (optional - you might want to allow some URLs)
    if (/https?:\/\/[^\s]+/gi.test(message)) {
      // You can choose to block or just flag URLs
      // blocked = true
      // reason = 'URLs not allowed'
    }

    return { 
      allowed: !blocked, 
      reason, 
      filteredMessage: filteredMessage !== message ? filteredMessage : null 
    }
  }

  // Cleanup inactive streams periodically
  setInterval(() => {
    const now = Date.now()
    for (const [streamId, streamRoom] of activeStreams.entries()) {
      // Remove streams inactive for more than 1 hour
      if (!streamRoom.isActive && (now - streamRoom.startedAt.getTime()) > 3600000) {
        activeStreams.delete(streamId)
        console.log(`Cleaned up inactive stream: ${streamId}`)
      }
    }
  }, 300000) // Check every 5 minutes

  console.log('Streaming WebSocket namespace initialized')
}
