// FILE: /server/ws/status-events.ts - FIXED WITH LAZY LOADING
// ============================================================================
// Status Events WebSocket Handler
// Real-time status updates and viewing
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

interface StatusData {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  mediaType: 'text' | 'image' | 'video' | 'audio'
  mediaUrl?: string
  backgroundColor?: string
  textColor?: string
  viewedBy: string[]
  expiresAt: string
  createdAt: string
}

interface UserStatusSocket extends Socket {
  userId?: string
}

const activeStatuses = new Map<string, StatusData>()
const statusViewers = new Map<string, Set<string>>()

export default defineWebSocketHandler({
  async open(peer, socket: UserStatusSocket) {
    console.log('[StatusEvents] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to status events server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserStatusSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'post_status':
          await handlePostStatus(socket, payload)
          break
        case 'get_statuses':
          await handleGetStatuses(socket, payload)
          break
        case 'view_status':
          await handleViewStatus(socket, payload)
          break
        case 'delete_status':
          await handleDeleteStatus(socket, payload)
          break
        case 'get_status_viewers':
          await handleGetStatusViewers(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown status type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[StatusEvents] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process status event'
      }))
    }
  },

  async close(peer, socket: UserStatusSocket) {
    console.log('[StatusEvents] Connection closed:', socket.id)
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: UserStatusSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[StatusEvents] User authenticated:', socket.userId)
    
    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[StatusEvents] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handlePostStatus(socket: UserStatusSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { content, mediaType, mediaUrl, backgroundColor, textColor } = payload

    const statusId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const status: StatusData = {
      id: statusId,
      userId: socket.userId,
      username: payload.username || 'Unknown',
      avatar: payload.avatar,
      content,
      mediaType: mediaType || 'text',
      mediaUrl,
      backgroundColor,
      textColor,
      viewedBy: [],
      expiresAt,
      createdAt: new Date().toISOString()
    }

    // Save to database
    const { error } = await supabase
      .from('statuses')
      .insert({
        id: statusId,
        user_id: socket.userId,
        content,
        media_type: mediaType || 'text',
        media_url: mediaUrl,
        background_color: backgroundColor,
        text_color: textColor,
        expires_at: expiresAt,
        created_at: status.createdAt
      })

    if (error) throw error

    activeStatuses.set(statusId, status)

    socket.send(JSON.stringify({
      type: 'status_posted',
      statusId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[StatusEvents] Post status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to post status'
    }))
  }
}

async function handleGetStatuses(socket: UserStatusSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { limit = 50 } = payload

    // Get statuses from connections
    const { data: connections, error: connError } = await supabase
      .from('connections')
      .select('connected_user_id')
      .eq('user_id', socket.userId)

    if (connError) throw connError

    const friendIds = (connections || []).map((c: any) => c.connected_user_id)

    const { data: statuses, error } = await supabase
      .from('statuses')
      .select('*')
      .in('user_id', [...friendIds, socket.userId])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'statuses',
      statuses: statuses || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[StatusEvents] Get statuses error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch statuses'
    }))
  }
}

async function handleViewStatus(socket: UserStatusSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { statusId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    // Record view
    const { error } = await supabase
      .from('status_views')
      .insert({
        status_id: statusId,
        viewer_id: socket.userId,
        viewed_at: new Date().toISOString()
      })

    if (error) throw error

    // Update viewers set
    if (!statusViewers.has(statusId)) {
      statusViewers.set(statusId, new Set())
    }
    statusViewers.get(statusId)!.add(socket.userId)

    socket.send(JSON.stringify({
      type: 'status_viewed',
      statusId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[StatusEvents] View status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to record status view'
    }))
  }
}

async function handleDeleteStatus(socket: UserStatusSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { statusId } = payload

    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', statusId)
      .eq('user_id', socket.userId)

    if (error) throw error

    activeStatuses.delete(statusId)
    statusViewers.delete(statusId)

    socket.send(JSON.stringify({
      type: 'status_deleted',
      statusId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[StatusEvents] Delete status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete status'
    }))
  }
}

async function handleGetStatusViewers(socket: UserStatusSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { statusId } = payload

    const { data: views, error } = await supabase
      .from('status_views')
      .select('viewer_id, viewed_at')
      .eq('status_id', statusId)
      .order('viewed_at', { ascending: false })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'status_viewers',
      viewers: views || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[StatusEvents] Get status viewers error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch status viewers'
    }))
  }
}
