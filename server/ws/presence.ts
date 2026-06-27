// FILE: /server/ws/presence.ts - FIXED WITH LAZY LOADING
// ============================================================================
// User Presence & Online Status WebSocket Handler
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

interface PresenceData {
  userId: string
  status: 'online' | 'away' | 'offline' | 'dnd'
  lastSeen: string
  currentActivity?: string
  location?: string
  device?: string
}

interface UserPresenceSocket extends Socket {
  userId?: string
  presenceData?: PresenceData
}

const userPresence = new Map<string, PresenceData>()
const userSockets = new Map<string, Set<string>>()

export default defineWebSocketHandler({
  async open(peer, socket: UserPresenceSocket) {
    console.log('[Presence] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to presence server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserPresenceSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'set_status':
          await handleSetStatus(socket, payload)
          break
        case 'get_presence':
          await handleGetPresence(socket, payload)
          break
        case 'get_online_friends':
          await handleGetOnlineFriends(socket, payload)
          break
        case 'set_activity':
          await handleSetActivity(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown presence type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[Presence] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process presence'
      }))
    }
  },

  async close(peer, socket: UserPresenceSocket) {
    console.log('[Presence] Connection closed:', socket.id)
    if (socket.userId) {
      const sockets = userSockets.get(socket.userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          userSockets.delete(socket.userId)
          userPresence.delete(socket.userId)
        }
      }
    }
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: UserPresenceSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[Presence] User authenticated:', socket.userId)

    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set())
    }
    userSockets.get(socket.userId)!.add(socket.id)

    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Presence] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleSetStatus(socket: UserPresenceSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { status } = payload

    const presenceData: PresenceData = {
      userId: socket.userId,
      status: status || 'online',
      lastSeen: new Date().toISOString(),
      currentActivity: payload.currentActivity,
      location: payload.location,
      device: payload.device
    }

    userPresence.set(socket.userId, presenceData)
    socket.presenceData = presenceData

    // Update in database
    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: socket.userId,
        status: status || 'online',
        last_seen: new Date().toISOString(),
        current_activity: payload.currentActivity,
        location: payload.location,
        device: payload.device
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'status_updated',
      status,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Presence] Set status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to set status'
    }))
  }
}

async function handleGetPresence(socket: UserPresenceSocket, payload: any) {
  try {
    const { userIds } = payload

    const presenceList = userIds
      .map((userId: string) => userPresence.get(userId))
      .filter((p: any) => p !== undefined)

    socket.send(JSON.stringify({
      type: 'presence',
      presence: presenceList,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Presence] Get presence error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch presence'
    }))
  }
}

async function handleGetOnlineFriends(socket: UserPresenceSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { data: connections, error } = await supabase
      .from('connections')
      .select('connected_user_id')
      .eq('user_id', socket.userId)

    if (error) throw error

    const friendIds = (connections || []).map((c: any) => c.connected_user_id)
    const onlineFriends = friendIds
      .map((id: string) => userPresence.get(id))
      .filter((p: any) => p !== undefined && p.status === 'online')

    socket.send(JSON.stringify({
      type: 'online_friends',
      friends: onlineFriends,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Presence] Get online friends error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch online friends'
    }))
  }
}

async function handleSetActivity(socket: UserPresenceSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { activity } = payload

    const presenceData = userPresence.get(socket.userId)
    if (presenceData) {
      presenceData.currentActivity = activity
    }

    const { error } = await supabase
      .from('user_presence')
      .update({
        current_activity: activity,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', socket.userId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'activity_updated',
      activity,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Presence] Set activity error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to set activity'
    }))
  }
}
