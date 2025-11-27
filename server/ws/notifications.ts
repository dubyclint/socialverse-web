// FILE: /server/ws/notifications.ts - FIXED WITH LAZY LOADING
// ============================================================================
// Real-time Notifications WebSocket Handler
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

interface NotificationData {
  id: string
  userId: string
  type: 'follow' | 'like' | 'comment' | 'mention' | 'message' | 'call' | 'stream' | 'pewgift' | 'system'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
}

interface UserNotificationSocket extends Socket {
  userId?: string
}

const userSubscriptions = new Map<string, Set<string>>()
const notificationQueue = new Map<string, NotificationData[]>()

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
        case 'subscribe':
          await handleSubscribe(socket, payload)
          break
        case 'unsubscribe':
          await handleUnsubscribe(socket, payload)
          break
        case 'get_notifications':
          await handleGetNotifications(socket, payload)
          break
        case 'mark_as_read':
          await handleMarkAsRead(socket, payload)
          break
        case 'mark_all_as_read':
          await handleMarkAllAsRead(socket, payload)
          break
        case 'delete_notification':
          await handleDeleteNotification(socket, payload)
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
      userSubscriptions.delete(socket.userId)
    }
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: UserNotificationSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[Notifications] User authenticated:', socket.userId)
    
    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleSubscribe(socket: UserNotificationSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { channels } = payload

    if (!userSubscriptions.has(socket.userId)) {
      userSubscriptions.set(socket.userId, new Set())
    }

    channels.forEach((channel: string) => {
      userSubscriptions.get(socket.userId)!.add(channel)
    })

    socket.send(JSON.stringify({
      type: 'subscribed',
      channels,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Subscribe error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to subscribe'
    }))
  }
}

async function handleUnsubscribe(socket: UserNotificationSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { channels } = payload

    const subscriptions = userSubscriptions.get(socket.userId)
    if (subscriptions) {
      channels.forEach((channel: string) => {
        subscriptions.delete(channel)
      })
    }

    socket.send(JSON.stringify({
      type: 'unsubscribed',
      channels,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Unsubscribe error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to unsubscribe'
    }))
  }
}

async function handleGetNotifications(socket: UserNotificationSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { limit = 20, offset = 0 } = payload

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', socket.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'notifications',
      notifications: data || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Get notifications error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch notifications'
    }))
  }
}

async function handleMarkAsRead(socket: UserNotificationSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { notificationId } = payload

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'notification_read',
      notificationId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Mark as read error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to mark notification as read'
    }))
  }
}

async function handleMarkAllAsRead(socket: UserNotificationSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', socket.userId)
      .eq('read', false)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'all_notifications_read',
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Mark all as read error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to mark all notifications as read'
    }))
  }
}

async function handleDeleteNotification(socket: UserNotificationSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { notificationId } = payload

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'notification_deleted',
      notificationId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[Notifications] Delete notification error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete notification'
    }))
  }
}
