// server/ws/enhanced-streaming.ts
import { StreamChat } from '~/models/StreamChat'
import { Stream } from '~/models/Stream'
import { StreamViewer } from '~/models/StreamViewer'
import { StreamPewGift } from '~/models/StreamPewGift'

interface EnhancedStreamingUser {
  userId: string
  username: string
  avatar?: string
  streamId?: string
  isStreamer: boolean
  isModerator: boolean
  joinTime: Date
  lastActivity: Date
  isTyping: boolean
  reactions: string[]
}

interface StreamAnalytics {
  streamId: string
  currentViewers: number
  peakViewers: number
  totalViews: number
  chatMessages: number
  pewGifts: number
  reactions: Record<string, number>
  averageWatchTime: number
  engagementRate: number
  lastUpdated: Date
}

interface ChatMessage {
  id: string
  streamId: string
  userId: string
  username: string
  avatar?: string
  message: string
  timestamp: Date
  messageType: 'text' | 'pewgift' | 'reaction' | 'system'
  reactions: Record<string, string[]> // emoji -> userIds
  isModerated: boolean
  isPinned: boolean
}

// Enhanced data structures
const streamingUsers = new Map<string, EnhancedStreamingUser>()
const streamRooms = new Map<string, Set<string>>()
const streamAnalytics = new Map<string, StreamAnalytics>()
const typingUsers = new Map<string, Set<string>>() // streamId -> Set of userIds
const moderators = new Map<string, Set<string>>() // streamId -> Set of moderator userIds
const bannedUsers = new Map<string, Set<string>>() // streamId -> Set of banned userIds

// Analytics tracking
const analyticsInterval = 30000 // 30 seconds
const cleanupInterval = 300000 // 5 minutes

export default defineWebSocketHandler({
  async open(peer, socket) {
    console.log('Enhanced Streaming WebSocket connection opened')
    socket.send(JSON.stringify({ 
      type: 'connection', 
      message: 'Connected to enhanced streaming server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      // Update user activity
      const user = streamingUsers.get(socket.id)
      if (user) {
        user.lastActivity = new Date()
      }

      switch (type) {
        // Enhanced stream management
        case 'join_stream':
          await handleEnhancedJoinStream(socket, payload)
          break

        case 'leave_stream':
          await handleEnhancedLeaveStream(socket, payload)
          break

        // Advanced chat features
        case 'stream_chat':
          await handleEnhancedStreamChat(socket, payload)
          break

        case 'typing_start':
          await handleTypingStart(socket, payload)
          break

        case 'typing_stop':
          await handleTypingStop(socket, payload)
          break

        case 'message_reaction':
          await handleMessageReaction(socket, payload)
          break

        case 'pin_message':
          await handlePinMessage(socket, payload)
          break

        case 'delete_message':
          await handleDeleteMessage(socket, payload)
          break

        // Stream reactions and interactions
        case 'stream_reaction':
          await handleStreamReaction(socket, payload)
          break

        case 'send_pewgift':
          await handleEnhancedPewGift(socket, payload)
          break

        // Moderation features
        case 'ban_user':
          await handleBanUser(socket, payload)
          break

        case 'unban_user':
          await handleUnbanUser(socket, payload)
          break

        case 'timeout_user':
          await handleTimeoutUser(socket, payload)
          break

        case 'add_moderator':
          await handleAddModerator(socket, payload)
          break

        // Analytics and status
        case 'request_analytics':
          await handleRequestAnalytics(socket, payload)
          break

        case 'stream_status_update':
          await handleStreamStatusUpdate(socket, payload)
          break

        case 'heartbeat':
          await handleHeartbeat(socket, payload)
          break

        default:
          console.log('Unknown enhanced streaming message type:', type)
      }
    } catch (error) {
      console.error('Enhanced Streaming WebSocket error:', error)
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }))
    }
  },

  async close(peer, socket) {
    const user = streamingUsers.get(socket.id)
    if (user && user.streamId) {
      await handleEnhancedLeaveStream(socket, { streamId: user.streamId })
    }
    streamingUsers.delete(socket.id)
    console.log('Enhanced Streaming WebSocket connection closed')
  }
})

// Enhanced join stream with analytics
async function handleEnhancedJoinStream(socket: any, payload: any) {
  const { streamId, userId, username, avatar, isStreamer = false, isModerator = false } = payload

  try {
    // Check if user is banned
    const banned = bannedUsers.get(streamId)
    if (banned && banned.has(userId) && !isStreamer) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'You are banned from this stream',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // Verify stream exists
    const stream = await Stream.findOne({ streamId })
    if (!stream) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Stream not found',
        timestamp: new Date().toISOString()
      }))
      return
    }

    if (stream.status !== 'live' && !isStreamer) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Stream is not currently live',
        timestamp: new Date().toISOString()
      }))
      return
    }

    const joinTime = new Date()

    // Add user to streaming users
    streamingUsers.set(socket.id, {
      userId,
      username,
      avatar,
      streamId,
      isStreamer,
      isModerator,
      joinTime,
      lastActivity: joinTime,
      isTyping: false,
      reactions: []
    })

    // Add to room
    if (!streamRooms.has(streamId)) {
      streamRooms.set(streamId, new Set())
    }
    streamRooms.get(streamId)!.add(socket.id)

    // Initialize or update analytics
    if (!streamAnalytics.has(streamId)) {
      streamAnalytics.set(streamId, {
        streamId,
        currentViewers: 0,
        peakViewers: 0,
        totalViews: 0,
        chatMessages: 0,
        pewGifts: 0,
        reactions: {},
        averageWatchTime: 0,
        engagementRate: 0,
        lastUpdated: new Date()
      })
    }

    const analytics = streamAnalytics.get(streamId)!
    analytics.currentViewers = streamRooms.get(streamId)!.size
    analytics.totalViews += 1
    if (analytics.currentViewers > analytics.peakViewers) {
      analytics.peakViewers = analytics.currentViewers
    }
    analytics.lastUpdated = new Date()

    // Create viewer record
    if (!isStreamer) {
      await StreamViewer.create({
        streamId,
        userId,
        joinTime,
        isActive: true
      })
    }

    // Update stream viewer count
    await Stream.findOneAndUpdate(
      { streamId },
      { 
        viewerCount: analytics.currentViewers,
        peakViewers: analytics.peakViewers,
        totalViews: analytics.totalViews
      }
    )

    // Send success response
    socket.send(JSON.stringify({
      type: 'stream_joined',
      data: {
        streamId,
        viewerCount: analytics.currentViewers,
        isStreamer,
        isModerator,
        streamStatus: stream.status
      },
      timestamp: new Date().toISOString()
    }))

    // Broadcast viewer count update to all users in stream
    broadcastToStream(streamId, {
      type: 'viewer_count_update',
      data: {
        viewerCount: analytics.currentViewers,
        peakViewers: analytics.peakViewers
      },
      timestamp: new Date().toISOString()
    })

    // Send user joined notification
    if (!isStreamer) {
      broadcastToStream(streamId, {
        type: 'user_joined',
        data: {
          userId,
          username,
          avatar,
          viewerCount: analytics.currentViewers
        },
        timestamp: new Date().toISOString()
      }, socket.id) // Exclude the user who joined
    }

  } catch (error) {
    console.error('Error in handleEnhancedJoinStream:', error)
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to join stream',
      timestamp: new Date().toISOString()
    }))
  }
}

// Enhanced leave stream with analytics
async function handleEnhancedLeaveStream(socket: any, payload: any) {
  const { streamId } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  try {
    // Remove from room
    const room = streamRooms.get(streamId)
    if (room) {
      room.delete(socket.id)
      
      // Update analytics
      const analytics = streamAnalytics.get(streamId)
      if (analytics) {
        analytics.currentViewers = room.size
        analytics.lastUpdated = new Date()
        
        // Calculate watch time
        const watchTime = (new Date().getTime() - user.joinTime.getTime()) / 1000
        analytics.averageWatchTime = (analytics.averageWatchTime + watchTime) / 2
      }

      // Update viewer record
      if (!user.isStreamer) {
        await StreamViewer.findOneAndUpdate(
          { streamId, userId: user.userId, isActive: true },
          { 
            leaveTime: new Date(),
            isActive: false,
            totalWatchTime: (new Date().getTime() - user.joinTime.getTime()) / 1000
          }
        )
      }

      // Update stream viewer count
      await Stream.findOneAndUpdate(
        { streamId },
        { viewerCount: room.size }
      )

      // Broadcast updated viewer count
      broadcastToStream(streamId, {
        type: 'viewer_count_update',
        data: {
          viewerCount: room.size,
          peakViewers: analytics?.peakViewers || 0
        },
        timestamp: new Date().toISOString()
      })

      // Send user left notification
      if (!user.isStreamer) {
        broadcastToStream(streamId, {
          type: 'user_left',
          data: {
            userId: user.userId,
            username: user.username,
            viewerCount: room.size
          },
          timestamp: new Date().toISOString()
        })
      }
    }

    // Remove from typing users
    const typing = typingUsers.get(streamId)
    if (typing) {
      typing.delete(user.userId)
    }

    streamingUsers.delete(socket.id)

  } catch (error) {
    console.error('Error in handleEnhancedLeaveStream:', error)
  }
}

// Enhanced chat with moderation and reactions
async function handleEnhancedStreamChat(socket: any, payload: any) {
  const { streamId, message, messageType = 'text' } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) {
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Not authorized to send messages in this stream',
      timestamp: new Date().toISOString()
    }))
    return
  }

  // Check if user is banned
  const banned = bannedUsers.get(streamId)
  if (banned && banned.has(user.userId)) {
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'You are banned from chatting in this stream',
      timestamp: new Date().toISOString()
    }))
    return
  }

  try {
    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      streamId,
      userId: user.userId,
      username: user.username,
      avatar: user.avatar,
      message,
      timestamp: new Date(),
      messageType,
      reactions: {},
      isModerated: false,
      isPinned: false
    }

    // Save to database
    await StreamChat.create(chatMessage)

    // Update analytics
    const analytics = streamAnalytics.get(streamId)
    if (analytics) {
      analytics.chatMessages += 1
      analytics.engagementRate = (analytics.chatMessages + analytics.pewGifts) / analytics.totalViews
      analytics.lastUpdated = new Date()
    }

    // Broadcast message to all users in stream
    broadcastToStream(streamId, {
      type: 'stream_chat_message',
      data: chatMessage,
      timestamp: new Date().toISOString()
    })

    // Stop typing indicator for this user
    await handleTypingStop(socket, { streamId })

  } catch (error) {
    console.error('Error in handleEnhancedStreamChat:', error)
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to send message',
      timestamp: new Date().toISOString()
    }))
  }
}

// Typing indicators
async function handleTypingStart(socket: any, payload: any) {
  const { streamId } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  if (!typingUsers.has(streamId)) {
    typingUsers.set(streamId, new Set())
  }

  const typing = typingUsers.get(streamId)!
  if (!typing.has(user.userId)) {
    typing.add(user.userId)
    user.isTyping = true

    // Broadcast typing indicator
    broadcastToStream(streamId, {
      type: 'typing_indicator',
      data: {
        userId: user.userId,
        username: user.username,
        isTyping: true
      },
      timestamp: new Date().toISOString()
    }, socket.id)
  }
}

async function handleTypingStop(socket: any, payload: any) {
  const { streamId } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  const typing = typingUsers.get(streamId)
  if (typing && typing.has(user.userId)) {
    typing.delete(user.userId)
    user.isTyping = false

    // Broadcast typing stopped
    broadcastToStream(streamId, {
      type: 'typing_indicator',
      data: {
        userId: user.userId,
        username: user.username,
        isTyping: false
      },
      timestamp: new Date().toISOString()
    }, socket.id)
  }
}

// Message reactions
async function handleMessageReaction(socket: any, payload: any) {
  const { streamId, messageId, emoji, action } = payload // action: 'add' | 'remove'
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  try {
    const message = await StreamChat.findOne({ _id: messageId, streamId })
    if (!message) return

    if (!message.reactions) {
      message.reactions = {}
    }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = []
    }

    const userIndex = message.reactions[emoji].indexOf(user.userId)

    if (action === 'add' && userIndex === -1) {
      message.reactions[emoji].push(user.userId)
    } else if (action === 'remove' && userIndex > -1) {
      message.reactions[emoji].splice(userIndex, 1)
    }

    // Clean up empty reaction arrays
    if (message.reactions[emoji].length === 0) {
      delete message.reactions[emoji]
    }

    await message.save()

    // Broadcast reaction update
    broadcastToStream(streamId, {
      type: 'message_reaction_update',
      data: {
        messageId,
        reactions: message.reactions,
        userId: user.userId,
        emoji,
        action
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in handleMessageReaction:', error)
  }
}

// Stream reactions (live reactions on video)
async function handleStreamReaction(socket: any, payload: any) {
  const { streamId, emoji, position } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  try {
    // Update analytics
    const analytics = streamAnalytics.get(streamId)
    if (analytics) {
      if (!analytics.reactions[emoji]) {
        analytics.reactions[emoji] = 0
      }
      analytics.reactions[emoji] += 1
      analytics.engagementRate = (analytics.chatMessages + analytics.pewGifts + Object.values(analytics.reactions).reduce((a, b) => a + b, 0)) / analytics.totalViews
      analytics.lastUpdated = new Date()
    }

    // Broadcast live reaction
    broadcastToStream(streamId, {
      type: 'live_reaction',
      data: {
        userId: user.userId,
        username: user.username,
        emoji,
        position,
        id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in handleStreamReaction:', error)
  }
}

// Enhanced PewGift with animations
async function handleEnhancedPewGift(socket: any, payload: any) {
  const { streamId, receiverId, giftType, amount, message } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) return

  try {
    // Create PewGift record
    const pewGift = await StreamPewGift.create({
      streamId,
      senderId: user.userId,
      receiverId,
      giftType,
      amount,
      message,
      timestamp: new Date()
    })

    // Update analytics
    const analytics = streamAnalytics.get(streamId)
    if (analytics) {
      analytics.pewGifts += 1
      analytics.engagementRate = (analytics.chatMessages + analytics.pewGifts) / analytics.totalViews
      analytics.lastUpdated = new Date()
    }

    // Broadcast PewGift with enhanced data
    broadcastToStream(streamId, {
      type: 'pewgift_sent',
      data: {
        id: pewGift._id,
        senderId: user.userId,
        senderUsername: user.username,
        senderAvatar: user.avatar,
        receiverId,
        giftType,
        amount,
        message,
        timestamp: new Date().toISOString(),
        animationType: getGiftAnimation(giftType, amount)
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in handleEnhancedPewGift:', error)
  }
}

// Analytics request handler
async function handleRequestAnalytics(socket: any, payload: any) {
  const { streamId } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || (!user.isStreamer && !user.isModerator)) {
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Not authorized to view analytics',
      timestamp: new Date().toISOString()
    }))
    return
  }

  try {
    const analytics = streamAnalytics.get(streamId)
    const stream = await Stream.findOne({ streamId })
    
    if (analytics && stream) {
      // Get additional analytics from database
      const totalChatMessages = await StreamChat.countDocuments({ streamId })
      const totalPewGifts = await StreamPewGift.countDocuments({ streamId })
      const totalViewers = await StreamViewer.countDocuments({ streamId })
      const avgWatchTime = await StreamViewer.aggregate([
        { $match: { streamId, totalWatchTime: { $exists: true } } },
        { $group: { _id: null, avgTime: { $avg: '$totalWatchTime' } } }
      ])

      const enhancedAnalytics = {
        ...analytics,
        totalChatMessages,
        totalPewGifts,
        totalViewers,
        averageWatchTime: avgWatchTime[0]?.avgTime || 0,
        streamDuration: stream.duration || 0,
        streamStatus: stream.status
      }

      socket.send(JSON.stringify({
        type: 'stream_analytics',
        data: enhancedAnalytics,
        timestamp: new Date().toISOString()
      }))
    }

  } catch (error) {
    console.error('Error in handleRequestAnalytics:', error)
  }
}

// Utility functions
function broadcastToStream(streamId: string, message: any, excludeSocketId?: string) {
  const room = streamRooms.get(streamId)
  if (!room) return

  const messageStr = JSON.stringify(message)
  
  room.forEach(socketId => {
    if (socketId !== excludeSocketId) {
      // In a real implementation, you'd need access to the socket instance
      // This is a simplified version - you'd need to maintain socket references
      console.log(`Broadcasting to ${socketId}:`, message.type)
    }
  })
}

function getGiftAnimation(giftType: string, amount: number): string {
  // Define animation types based on gift value
  if (amount >= 1000) return 'spectacular'
  if (amount >= 500) return 'impressive'
  if (amount >= 100) return 'exciting'
  return 'standard'
}

// Cleanup and maintenance
setInterval(() => {
  // Clean up inactive users
  const now = new Date()
  const inactiveThreshold = 5 * 60 * 1000 // 5 minutes

  streamingUsers.forEach((user, socketId) => {
    if (now.getTime() - user.lastActivity.getTime() > inactiveThreshold) {
      console.log(`Cleaning up inactive user: ${user.username}`)
      // Handle cleanup
    }
  })

  // Clean up empty typing indicators
  typingUsers.forEach((users, streamId) => {
    if (users.size === 0) {
      typingUsers.delete(streamId)
    }
  })

}, cleanupInterval)

// Periodic analytics updates
setInterval(() => {
  streamAnalytics.forEach(async (analytics, streamId) => {
    try {
      await Stream.findOneAndUpdate(
        { streamId },
        {
          viewerCount: analytics.currentViewers,
          peakViewers: analytics.peakViewers,
          totalViews: analytics.totalViews
        }
      )
    } catch (error) {
      console.error('Error updating stream analytics:', error)
    }
  })
}, analyticsInterval)
