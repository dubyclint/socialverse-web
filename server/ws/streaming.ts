// FILE: /server/ws/streaming.ts - FIXED WITH LAZY LOADING
// ============================================================================
// Streaming WebSocket Handler
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

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
  viewerCount: number
  startedAt: Date
  isActive: boolean
}

const activeStreams = new Map<string, StreamRoom>()
const userStreams = new Map<string, string>()

export default defineWebSocketHandler({
  async open(peer, socket: StreamSocket) {
    console.log('[Streaming] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to streaming server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: StreamSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'start_stream':
          await handleStartStream(socket, payload)
          break
        case 'stop_stream':
          await handleStopStream(socket, payload)
          break
        case 'join_stream':
          await handleJoinStream(socket, payload)
          break
        case 'leave_stream':
          await handleLeaveStream(socket, payload)
          break
        case 'get_stream_info':
          await handleGetStreamInfo(socket, payload)
          break
        case 'send_chat':
          await handleSendChat(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown streaming type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[Streaming] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process streaming message'
      }))
    }
  },

  async close(peer, socket: StreamSocket) {
    console.log('[Streaming] Connection closed:', socket.id)
    if (socket.isStreamer && socket.streamId) {
      await handleStopStream(socket, { streamId: socket.streamId })
    } else if (socket.streamId) {
      await handleLeaveStream(socket, { streamId: socket.streamId })
    }
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: StreamSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[Streaming] User authenticated:', socket.userId)
    
    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleStartStream(socket: StreamSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const streamId = crypto.randomUUID()
    const { title, description, category } = payload

    // Save to database
    const { error } = await supabase
      .from('streams')
      .insert({
        id: streamId,
        user_id: socket.userId,
        title,
        description,
        category,
        status: 'live',
        started_at: new Date().toISOString()
      })

    if (error) throw error

    const streamRoom: StreamRoom = {
      streamId,
      viewers: new Map(),
      viewerCount: 0,
      startedAt: new Date(),
      isActive: true
    }

    activeStreams.set(streamId, streamRoom)
    userStreams.set(socket.userId, streamId)
    socket.streamId = streamId
    socket.isStreamer = true

    socket.send(JSON.stringify({
      type: 'stream_started',
      streamId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Start stream error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to start stream'
    }))
  }
}

async function handleStopStream(socket: StreamSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { streamId } = payload

    if (!streamId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Stream ID required'
      }))
      return
    }

    // Update database
    const { error } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId)

    if (error) throw error

    const stream = activeStreams.get(streamId)
    if (stream) {
      activeStreams.delete(streamId)
    }

    if (socket.userId) {
      userStreams.delete(socket.userId)
    }

    socket.send(JSON.stringify({
      type: 'stream_stopped',
      streamId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Stop stream error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to stop stream'
    }))
  }
}

async function handleJoinStream(socket: StreamSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { streamId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    let stream = activeStreams.get(streamId)
    if (!stream) {
      stream = {
        streamId,
        viewers: new Map(),
        viewerCount: 0,
        startedAt: new Date(),
        isActive: true
      }
      activeStreams.set(streamId, stream)
    }

    const viewer: ViewerData = {
      userId: socket.userId,
      socketId: socket.id,
      joinedAt: new Date(),
      country: payload.country,
      userAgent: payload.userAgent
    }

    stream.viewers.set(socket.id, viewer)
    stream.viewerCount = stream.viewers.size
    socket.streamId = streamId
    socket.isStreamer = false

    // Record view
    const { error } = await supabase
      .from('stream_views')
      .insert({
        stream_id: streamId,
        viewer_id: socket.userId,
        joined_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'joined_stream',
      streamId,
      viewerCount: stream.viewerCount,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Join stream error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to join stream'
    }))
  }
}

async function handleLeaveStream(socket: StreamSocket, payload: any) {
  try {
    const { streamId } = payload

    if (!streamId) {
      return
    }

    const stream = activeStreams.get(streamId)
    if (stream) {
      stream.viewers.delete(socket.id)
      stream.viewerCount = stream.viewers.size

      if (stream.viewerCount === 0 && !stream.isActive) {
        activeStreams.delete(streamId)
      }
    }

    socket.send(JSON.stringify({
      type: 'left_stream',
      streamId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Leave stream error:', error)
  }
}

async function handleGetStreamInfo(socket: StreamSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { streamId } = payload

    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('id', streamId)
      .single()

    if (error) throw error

    const stream = activeStreams.get(streamId)

    socket.send(JSON.stringify({
      type: 'stream_info',
      stream: data,
      viewerCount: stream?.viewerCount || 0,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Get stream info error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch stream info'
    }))
  }
}

async function handleSendChat(socket: StreamSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { streamId, message } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        user_id: socket.userId,
        message,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'chat_sent',
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Streaming] Send chat error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send chat'
    }))
  }
}
