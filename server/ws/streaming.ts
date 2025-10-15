// server/ws/streaming.ts
import { StreamChat } from '~/models/StreamChat'
import { Stream } from '~/models/Stream'
import { StreamViewer } from '~/models/StreamViewer'
import { StreamPewGift } from '~/models/StreamPewGift'

interface StreamingUser {
  userId: string
  username: string
  avatar?: string
  streamId?: string
  isStreamer: boolean
}

const streamingUsers = new Map<string, StreamingUser>()
const streamRooms = new Map<string, Set<string>>() // streamId -> Set of socketIds

export default defineWebSocketHandler({
  async open(peer, socket) {
    console.log('Streaming WebSocket connection opened')
    socket.send(JSON.stringify({ 
      type: 'connection', 
      message: 'Connected to streaming server' 
    }))
  },

  async message(peer, socket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'join_stream':
          await handleJoinStream(socket, payload)
          break

        case 'leave_stream':
          await handleLeaveStream(socket, payload)
          break

        case 'stream_chat':
          await handleStreamChat(socket, payload)
          break

        case 'send_pewgift':
          await handleSendPewGift(socket, payload)
          break

        case 'stream_reaction':
          await handleStreamReaction(socket, payload)
          break

        case 'update_viewer_count':
          await handleUpdateViewerCount(socket, payload)
          break

        case 'stream_status_update':
          await handleStreamStatusUpdate(socket, payload)
          break

        case 'typing_indicator':
          await handleTypingIndicator(socket, payload)
          break

        default:
          console.log('Unknown streaming message type:', type)
      }
    } catch (error) {
      console.error('Streaming WebSocket error:', error)
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }))
    }
  },

  async close(peer, socket) {
    // Clean up user from all rooms when they disconnect
    const user = streamingUsers.get(socket.id)
    if (user && user.streamId) {
      await handleLeaveStream(socket, { streamId: user.streamId })
    }
    streamingUsers.delete(socket.id)
    console.log('Streaming WebSocket connection closed')
  }
})

async function handleJoinStream(socket: any, payload: any) {
  const { streamId, userId, username, avatar, isStreamer = false } = payload

  try {
    // Verify stream exists and is live
    const stream = await Stream.findOne({ streamId })
    if (!stream) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Stream not found' 
      }))
      return
    }

    if (stream.status !== 'live' && !isStreamer) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Stream is not currently live' 
      }))
      return
    }

    // Add user to streaming users
    streamingUsers.set(socket.id, {
      userId,
      username,
      avatar,
      streamId,
      isStreamer
    })

    // Add socket to stream room
    if (!streamRooms.has(streamId)) {
      streamRooms.set(streamId, new Set())
    }
    streamRooms.get(streamId)!.add(socket.id)

    // Send confirmation to user
    socket.send(JSON.stringify({
      type: 'joined_stream',
      payload: {
        streamId,
        stream: stream,
        message: 'Successfully joined stream'
      }
    }))

    // Broadcast user joined to other viewers (except streamer notifications)
    if (!isStreamer) {
      broadcastToStream(streamId, {
        type: 'user_joined',
        payload: {
          userId,
          username,
          avatar,
          timestamp: new Date()
        }
      }, socket.id)

      // Create system message
      const systemMessage = new StreamChat({
        streamId,
        userId,
        username,
        message: `${username} joined the stream`,
        messageType: 'system',
        systemData: {
          action: 'user_joined',
          data: { userId, username, avatar }
        }
      })
      await systemMessage.save()
    }

    // Update viewer count
    await updateStreamViewerCount(streamId)

  } catch (error) {
    console.error('Join stream error:', error)
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to join stream' 
    }))
  }
}

async function handleLeaveStream(socket: any, payload: any) {
  const { streamId } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) {
    return
  }

  try {
    // Remove from room
    const room = streamRooms.get(streamId)
    if (room) {
      room.delete(socket.id)
      if (room.size === 0) {
        streamRooms.delete(streamId)
      }
    }

    // Broadcast user left (except for streamers)
    if (!user.isStreamer) {
      broadcastToStream(streamId, {
        type: 'user_left',
        payload: {
          userId: user.userId,
          username: user.username,
          timestamp: new Date()
        }
      }, socket.id)

      // Create system message
      const systemMessage = new StreamChat({
        streamId,
        userId: user.userId,
        username: user.username,
        message: `${user.username} left the stream`,
        messageType: 'system',
        systemData: {
          action: 'user_left',
          data: { userId: user.userId, username: user.username }
        }
      })
      await systemMessage.save()
    }

    // Update viewer count
    await updateStreamViewerCount(streamId)

    // Remove user from streaming users
    streamingUsers.delete(socket.id)

    socket.send(JSON.stringify({
      type: 'left_stream',
      payload: { streamId, message: 'Left stream successfully' }
    }))

  } catch (error) {
    console.error('Leave stream error:', error)
  }
}

async function handleStreamChat(socket: any, payload: any) {
  const { streamId, message, messageType = 'text' } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) {
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Not in stream' 
    }))
    return
  }

  try {
    // Create chat message
    const chatMessage = new StreamChat({
      streamId,
      userId: user.userId,
      username: user.username,
      message: message.trim(),
      messageType,
      userAvatar: user.avatar,
      userBadges: [] // TODO: Get user badges
    })

    await chatMessage.save()

    // Broadcast to all viewers in stream
    broadcastToStream(streamId, {
      type: 'new_chat_message',
      payload: {
        id: chatMessage._id,
        streamId,
        userId: user.userId,
        username: user.username,
        message: message.trim(),
        messageType,
        timestamp: chatMessage.timestamp,
        userAvatar: user.avatar,
        userBadges: chatMessage.userBadges
      }
    })

  } catch (error) {
    console.error('Stream chat error:', error)
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to send message' 
    }))
  }
}

async function handleSendPewGift(socket: any, payload: any) {
  const { streamId, giftId, quantity = 1, message, isAnonymous = false } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) {
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Not in stream' 
    }))
    return
  }

  try {
    // Get stream details
    const stream = await Stream.findOne({ streamId })
    if (!stream || !stream.pewGiftsEnabled) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'PewGifts not enabled for this stream' 
      }))
      return
    }

    // TODO: Validate gift and process payment
    // For now, we'll create a mock gift
    const pewGift = new StreamPewGift({
      streamId,
      senderId: user.userId,
      receiverId: stream.userId,
      giftId,
      giftName: 'Heart', // TODO: Get from gift data
      giftImage: '/gifts/heart.png',
      giftValue: 10,
      quantity,
      message,
      isAnonymous,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      receiverUsername: 'Streamer' // TODO: Get streamer username
    })

    await pewGift.save()

    // Broadcast PewGift animation to all viewers
    broadcastToStream(streamId, {
      type: 'pewgift_received',
      payload: {
        id: pewGift._id,
        streamId,
        senderId: isAnonymous ? null : user.userId,
        senderUsername: isAnonymous ? 'Anonymous' : user.username,
        senderAvatar: isAnonymous ? null : user.avatar,
        giftId,
        giftName: pewGift.giftName,
        giftImage: pewGift.giftImage,
        giftValue: pewGift.giftValue,
        quantity,
        totalValue: pewGift.totalValue,
        message,
        timestamp: pewGift.timestamp,
        animationType: quantity > 5 ? 'combo' : 'normal'
      }
    })

    // Create chat message for the gift
    const giftChatMessage = new StreamChat({
      streamId,
      userId: user.userId,
      username: user.username,
      message: `sent ${quantity}x ${pewGift.giftName}${message ? `: ${message}` : ''}`,
      messageType: 'pewgift',
      userAvatar: user.avatar,
      pewGiftData: {
        giftId,
        giftName: pewGift.giftName,
        giftValue: pewGift.giftValue,
        giftImage: pewGift.giftImage,
        quantity
      }
    })

    await giftChatMessage.save()

    socket.send(JSON.stringify({
      type: 'pewgift_sent',
      payload: { message: 'PewGift sent successfully!' }
    }))

  } catch (error) {
    console.error('Send PewGift error:', error)
    socket.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to send PewGift' 
    }))
  }
}

async function handleStreamReaction(socket: any, payload: any) {
  const { streamId, emoji } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) {
    return
  }

  // Broadcast reaction to all viewers
  broadcastToStream(streamId, {
    type: 'stream_reaction',
    payload: {
      userId: user.userId,
      username: user.username,
      emoji,
      timestamp: new Date()
    }
  })
}

async function handleUpdateViewerCount(socket: any, payload: any) {
  const { streamId } = payload
  await updateStreamViewerCount(streamId)
}

async function handleStreamStatusUpdate(socket: any, payload: any) {
  const { streamId, status } = payload
  const user = streamingUsers.get(socket.id)

  // Only streamers can update stream status
  if (!user || !user.isStreamer || user.streamId !== streamId) {
    return
  }

  try {
    await Stream.updateOne({ streamId }, { status })
    
    broadcastToStream(streamId, {
      type: 'stream_status_changed',
      payload: { streamId, status, timestamp: new Date() }
    })
  } catch (error) {
    console.error('Stream status update error:', error)
  }
}

async function handleTypingIndicator(socket: any, payload: any) {
  const { streamId, isTyping } = payload
  const user = streamingUsers.get(socket.id)

  if (!user || user.streamId !== streamId) {
    return
  }

  broadcastToStream(streamId, {
    type: 'typing_indicator',
    payload: {
      userId: user.userId,
      username: user.username,
      isTyping,
      timestamp: new Date()
    }
  }, socket.id)
}

function broadcastToStream(streamId: string, message: any, excludeSocketId?: string) {
  const room = streamRooms.get(streamId)
  if (!room) return

  const messageStr = JSON.stringify(message)
  
  room.forEach(socketId => {
    if (socketId !== excludeSocketId) {
      // TODO: Get actual socket instance and send message
      // This depends on your WebSocket implementation
      console.log(`Broadcasting to ${socketId}:`, message.type)
    }
  })
}

async function updateStreamViewerCount(streamId: string) {
  try {
    const room = streamRooms.get(streamId)
    const viewerCount = room ? room.size : 0

    // Update database
    const stream = await Stream.findOneAndUpdate(
      { streamId },
      { 
        viewerCount,
        $max: { peakViewers: viewerCount }
      },
      { new: true }
    )

    if (stream) {
      // Broadcast updated viewer count
      broadcastToStream(streamId, {
        type: 'viewer_count_updated',
        payload: {
          streamId,
          viewerCount,
          peakViewers: stream.peakViewers
        }
      })
    }
  } catch (error) {
    console.error('Update viewer count error:', error)
  }
}
