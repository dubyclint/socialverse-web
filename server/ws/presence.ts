// server/ws/presence.ts
// User Presence & Online Status WebSocket Handler

import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
const typingUsers = new Map<string, Set<string>>()
const activityTracking = new Map<string, any>()

const PRESENCE_TIMEOUT = 5 * 60 * 1000
const TYPING_TIMEOUT = 3000

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
        case 'get_user_presence':
          await handleGetUserPresence(socket, payload)
          break
        case 'get_online_users':
          await handleGetOnlineUsers(socket, payload)
          break
        case 'typing_start':
          await handleTypingStart(socket, payload)
          break
        case 'typing_stop':
          await handleTypingStop(socket, payload)
          break
        case 'update_activity':
          await handleUpdateActivity(socket, payload)
          break
        case 'get_presence_list':
          await handleGetPresenceList(socket, payload)
          break
        case 'subscribe_presence':
          await handleSubscribePresence(socket, payload)
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
        message: 'Failed to process presence update'
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
          const presence = userPresence.get(socket.userId)
          if (presence) {
            presence.status = 'offline'
            presence.lastSeen = new Date().toISOString()
            broadcastPresenceUpdate(socket.userId, presence)
          }
        }
      }
    }
  }
})

async function handleAuthenticate(socket: UserPresenceSocket, payload: any) {
  try {
    const { userId, device, location } = payload
    if (!userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'User ID required' }))
      return
    }
    socket.userId = userId
    if (!userPresence.has(userId)) {
      userPresence.set(userId, {
        userId,
        status: 'online',
        lastSeen: new Date().toISOString(),
        device,
        location
      })
    } else {
      const presence = userPresence.get(userId)!
      presence.status = 'online'
      presence.lastSeen = new Date().toISOString()
      if (device) presence.device = device
      if (location) presence.location = location
    }
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set())
    }
    userSockets.get(userId)!.add(socket.id)
    socket.send(JSON.stringify({ type: 'authenticated', userId, status: 'online' }))
    broadcastPresenceUpdate(userId, userPresence.get(userId)!)
    console.log(`[Presence] User ${userId} authenticated`)
  } catch (error) {
    console.error('[Presence] Auth error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }))
  }
}

async function handleSetStatus(socket: UserPresenceSocket, payload: any) {
  try {
    const { status } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    if (!['online', 'away', 'offline', 'dnd'].includes(status)) {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid status' }))
      return
    }
    const presence = userPresence.get(socket.userId)!
    presence.status = status
    presence.lastSeen = new Date().toISOString()
    socket.send(JSON.stringify({ type: 'status_updated', status }))
    broadcastPresenceUpdate(socket.userId, presence)
    await supabase
      .from('user_presence')
      .upsert({
        user_id: socket.userId,
        status,
        last_seen: new Date().toISOString()
      })
  } catch (error) {
    console.error('[Presence] Set status error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to update status' }))
  }
}

async function handleGetUserPresence(socket: UserPresenceSocket, payload: any) {
  try {
    const { userId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const presence = userPresence.get(userId)
    socket.send(JSON.stringify({
      type: 'user_presence',
      presence: presence || { userId, status: 'offline', lastSeen: null }
    }))
  } catch (error) {
    console.error('[Presence] Get user presence error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to get user presence' }))
  }
}

async function handleGetOnlineUsers(socket: UserPresenceSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const onlineUsers = Array.from(userPresence.values()).filter(p => p.status === 'online')
    socket.send(JSON.stringify({
      type: 'online_users',
      users: onlineUsers,
      count: onlineUsers.length
    }))
  } catch (error) {
    console.error('[Presence] Get online users error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to get online users' }))
  }
}

async function handleTypingStart(socket: UserPresenceSocket, payload: any) {
  try {
    const { chatId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    if (!typingUsers.has(chatId)) {
      typingUsers.set(chatId, new Set())
    }
    typingUsers.get(chatId)!.add(socket.userId)
    broadcastTypingStatus(chatId, socket.userId, 'typing_start')
    setTimeout(() => {
      const typingSet = typingUsers.get(chatId)
      if (typingSet) {
        typingSet.delete(socket.userId)
        if (typingSet.size === 0) {
          typingUsers.delete(chatId)
        }
      }
    }, TYPING_TIMEOUT)
  } catch (error) {
    console.error('[Presence] Typing start error:', error)
  }
}

async function handleTypingStop(socket: UserPresenceSocket, payload: any) {
  try {
    const { chatId } = payload
    if (!socket.userId) return
    const typingSet = typingUsers.get(chatId)
    if (typingSet) {
      typingSet.delete(socket.userId)
      if (typingSet.size === 0) {
        typingUsers.delete(chatId)
      }
    }
    broadcastTypingStatus(chatId, socket.userId, 'typing_stop')
  } catch (error) {
    console.error('[Presence] Typing stop error:', error)
  }
}

async function handleUpdateActivity(socket: UserPresenceSocket, payload: any) {
  try {
    const { activity, metadata } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const presence = userPresence.get(socket.userId)!
    presence.currentActivity = activity
    activityTracking.set(socket.userId, {
      activity,
      metadata,
      timestamp: new Date().toISOString()
    })
    socket.send(JSON.stringify({ type: 'activity_updated', activity }))
    broadcastPresenceUpdate(socket.userId, presence)
  } catch (error) {
    console.error('[Presence] Update activity error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to update activity' }))
  }
}

async function handleGetPresenceList(socket: UserPresenceSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const presenceList = Array.from(userPresence.values())
    socket.send(JSON.stringify({
      type: 'presence_list',
      presences: presenceList,
      count: presenceList.length
    }))
  } catch (error) {
    console.error('[Presence] Get presence list error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to get presence list' }))
  }
}

async function handleSubscribePresence(socket: UserPresenceSocket, payload: any) {
  try {
    const { userIds } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const presences = userIds
      .map((id: string) => userPresence.get(id))
      .filter(Boolean)
    socket.send(JSON.stringify({ type: 'subscribed_presences', presences }))
  } catch (error) {
    console.error('[Presence] Subscribe presence error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to subscribe to presence' }))
  }
}

function broadcastPresenceUpdate(userId: string, presence: PresenceData) {
  console.log(`[Presence] Broadcasting update for user ${userId}:`, presence.status)
}

function broadcastTypingStatus(chatId: string, userId: string, type: string) {
  console.log(`[Presence] ${type} in chat ${chatId} by user ${userId}`)
}
