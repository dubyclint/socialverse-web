// server/ws/notifications.ts
// Real-time Notifications WebSocket Handler

import type { Socket, Server } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface NotificationData {
  id: string
  userId: string
  type: 'follow' | 'like' | 'comment' | 'mention' | 'message' | 'call' | 'stream' | 'pewgift' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
  actionUrl?: string
}

interface UserNotificationSocket extends Socket {
  userId?: string
  notificationRooms?: Set<string>
}

const userConnections = new Map<string, Set<string>>()
const notificationQueues = new Map<string, NotificationData[]>()

export default defineWebSocketHandler({
  async open(peer, socket: UserNotificationSocket) {
    console.log('[Notifications] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to notifications server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserNotificationSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'subscribe_notifications':
          await handleSubscribeNotifications(socket, payload)
          break
        case 'mark_as_read':
          await handleMarkAsRead(socket, payload)
          break
        case 'mark_all_read':
          await handleMarkAllRead(socket, payload)
          break
        case 'delete_notification':
          await handleDeleteNotification(socket, payload)
          break
        case 'get_unread_count':
          await handleGetUnreadCount(socket, payload)
          break
        case 'get_notifications':
          await handleGetNotifications(socket, payload)
          break
        case 'clear_all':
          await handleClearAll(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown notification type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[Notifications] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process notification'
      }))
    }
  },

  async close(peer, socket: UserNotificationSocket) {
    console.log('[Notifications] Connection closed:', socket.id)
    if (socket.userId) {
      const connections = userConnections.get(socket.userId)
      if (connections) {
        connections.delete(socket.id)
        if (connections.size === 0) {
          userConnections.delete(socket.userId)
        }
      }
    }
  }
})

async function handleAuthenticate(socket: UserNotificationSocket, payload: any) {
  try {
    const { userId } = payload
    if (!userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'User ID required' }))
      return
    }
    socket.userId = userId
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set())
    }
    userConnections.get(userId)!.add(socket.id)
    socket.send(JSON.stringify({ type: 'authenticated', userId, socketId: socket.id }))
    console.log(`[Notifications] User ${userId} authenticated`)
  } catch (error) {
    console.error('[Notifications] Auth error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }))
  }
}

async function handleSubscribeNotifications(socket: UserNotificationSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', socket.userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    socket.send(JSON.stringify({
      type: 'notifications_list',
      notifications: notifications || [],
      count: notifications?.length || 0
    }))
  } catch (error) {
    console.error('[Notifications] Subscribe error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch notifications' }))
  }
}

async function handleMarkAsRead(socket: UserNotificationSocket, payload: any) {
  try {
    const { notificationId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'notification_marked_read', notificationId }))
    broadcastToUser(socket.userId, { type: 'notification_read', notificationId })
  } catch (error) {
    console.error('[Notifications] Mark read error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to mark notification as read' }))
  }
}

async function handleMarkAllRead(socket: UserNotificationSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', socket.userId)
      .eq('read', false)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'all_marked_read' }))
    broadcastToUser(socket.userId, { type: 'all_notifications_read' })
  } catch (error) {
    console.error('[Notifications] Mark all read error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to mark all as read' }))
  }
}

async function handleDeleteNotification(socket: UserNotificationSocket, payload: any) {
  try {
    const { notificationId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'notification_deleted', notificationId }))
    broadcastToUser(socket.userId, { type: 'notification_deleted', notificationId })
  } catch (error) {
    console.error('[Notifications] Delete error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to delete notification' }))
  }
}

async function handleGetUnreadCount(socket: UserNotificationSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', socket.userId)
      .eq('read', false)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'unread_count', count: count || 0 }))
  } catch (error) {
    console.error('[Notifications] Unread count error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to get unread count' }))
  }
}

async function handleGetNotifications(socket: UserNotificationSocket, payload: any) {
  try {
    const { limit = 20, offset = 0 } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', socket.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    socket.send(JSON.stringify({
      type: 'notifications_paginated',
      notifications: notifications || [],
      offset,
      limit
    }))
  } catch (error) {
    console.error('[Notifications] Get notifications error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch notifications' }))
  }
}

async function handleClearAll(socket: UserNotificationSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', socket.userId)
    if (error) throw error
    socket.send(JSON.stringify({ type: 'all_cleared' }))
    broadcastToUser(socket.userId, { type: 'all_notifications_cleared' })
  } catch (error) {
    console.error('[Notifications] Clear all error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to clear notifications' }))
  }
}

function broadcastToUser(userId: string, message: any) {
  const connections = userConnections.get(userId)
  if (connections) {
    connections.forEach(socketId => {
      console.log(`[Notifications] Broadcasting to user ${userId}`)
    })
  }
}
