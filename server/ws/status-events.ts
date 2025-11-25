// server/ws/status-events.ts
// Status Events WebSocket Handler
// Real-time status updates and viewing

import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  isActive: boolean
  expiresAt: string
  createdAt: string
  views: number
  viewedBy: Set<string>
}

interface StatusView {
  statusId: string
  viewerId: string
  viewedAt: string
}

interface UserStatusSocket extends Socket {
  userId?: string
  watchingStatuses?: Set<string>
}

const activeStatuses = new Map<string, StatusData>()
const statusViews = new Map<string, Set<string>>() // statusId -> Set of viewerIds
const userStatusWatchers = new Map<string, Set<string>>() // userId -> Set of watcher socketIds

export default defineWebSocketHandler({
  async open(peer, socket: UserStatusSocket) {
    console.log('[Status] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to status server',
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

        case 'create_status':
          await handleCreateStatus(socket, payload)
          break

        case 'update_status':
          await handleUpdateStatus(socket, payload)
          break

        case 'delete_status':
          await handleDeleteStatus(socket, payload)
          break

        case 'view_status':
          await handleViewStatus(socket, payload)
          break

        case 'get_status':
          await handleGetStatus(socket, payload)
          break

        case 'get_user_statuses':
          await handleGetUserStatuses(socket, payload)
          break

        case 'get_friend_statuses':
          await handleGetFriendStatuses(socket, payload)
          break

        case 'watch_user_status':
          await handleWatchUserStatus(socket, payload)
          break

        case 'unwatch_user_status':
          await handleUnwatchUserStatus(socket, payload)
          break

        case 'get_status_views':
          await handleGetStatusViews(socket, payload)
          break

        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown status type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[Status] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process status event'
      }))
    }
  },

  async close(peer, socket: UserStatusSocket) {
    console.log('[Status] Connection closed:', socket.id)
    if (socket.userId && socket.watchingStatuses) {
      socket.watchingStatuses.forEach(userId => {
        const watchers = userStatusWatchers.get(userId)
        if (watchers) {
          watchers.delete(socket.id)
        }
      })
    }
  }
})

async function handleAuthenticate(socket: UserStatusSocket, payload: any) {
  try {
    const { userId } = payload

    if (!userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'User ID required'
      }))
      return
    }

    socket.userId = userId
    socket.watchingStatuses = new Set()

    socket.send(JSON.stringify({
      type: 'authenticated',
      userId,
      socketId: socket.id
    }))

    console.log(`[Status] User ${userId} authenticated`)
  } catch (error) {
    console.error('[Status] Auth error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleCreateStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { content, mediaType, mediaUrl, backgroundColor, textColor, expiresIn } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const statusId = `status_${Date.now()}_${socket.userId}`
    const expiresAt = new Date(Date.now() + (expiresIn || 24 * 60 * 60 * 1000))

    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', socket.userId)
      .single()

    const status: StatusData = {
      id: statusId,
      userId: socket.userId,
      username: userData?.username || 'Unknown',
      avatar: userData?.avatar_url,
      content,
      mediaType,
      mediaUrl,
      backgroundColor,
      textColor,
      isActive: true,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      views: 0,
      viewedBy: new Set()
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('user_statuses')
      .insert({
        id: statusId,
        user_id: socket.userId,
        content,
        media_type: mediaType,
        media_url: mediaUrl,
        background_color: backgroundColor,
        text_color: textColor,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    activeStatuses.set(statusId, status)
    statusViews.set(statusId, new Set())

    socket.send(JSON.stringify({
      type: 'status_created',
      status
    }))

    broadcastStatusUpdate(socket.userId, {
      type: 'new_status',
      status
    })

    console.log(`[Status] Status created by user ${socket.userId}`)
  } catch (error) {
    console.error('[Status] Create status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to create status'
    }))
  }
}

async function handleUpdateStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { statusId, content, backgroundColor, textColor } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const status = activeStatuses.get(statusId)
    if (!status || status.userId !== socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Status not found or unauthorized'
      }))
      return
    }

    status.content = content || status.content
    status.backgroundColor = backgroundColor || status.backgroundColor
    status.textColor = textColor || status.textColor

    const { error } = await supabase
      .from('user_statuses')
      .update({
        content,
        background_color: backgroundColor,
        text_color: textColor
      })
      .eq('id', statusId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'status_updated',
      status
    }))

    broadcastStatusUpdate(socket.userId, {
      type: 'status_updated',
      status
    })
  } catch (error) {
    console.error('[Status] Update status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to update status'
    }))
  }
}

async function handleDeleteStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { statusId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const status = activeStatuses.get(statusId)
    if (!status || status.userId !== socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Status not found or unauthorized'
      }))
      return
    }

    const { error } = await supabase
      .from('user_statuses')
      .update({ is_active: false })
      .eq('id', statusId)

    if (error) throw error

    activeStatuses.delete(statusId)
    statusViews.delete(statusId)

    socket.send(JSON.stringify({
      type: 'status_deleted',
      statusId
    }))

    broadcastStatusUpdate(socket.userId, {
      type: 'status_deleted',
      statusId
    })

    console.log(`[Status] Status ${statusId} deleted by user ${socket.userId}`)
  } catch (error) {
    console.error('[Status] Delete status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to delete status'
    }))
  }
}

async function handleViewStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { statusId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const status = activeStatuses.get(statusId)
    if (!status) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Status not found'
      }))
      return
    }

    const viewers = statusViews.get(statusId)!
    if (!viewers.has(socket.userId)) {
      viewers.add(socket.userId)
      status.views++

      // Save view to database
      await supabase
        .from('status_views')
        .insert({
          status_id: statusId,
          viewer_id: socket.userId,
          viewed_at: new Date().toISOString()
        })

      broadcastStatusUpdate(status.userId, {
        type: 'status_viewed',
        statusId,
        viewerId: socket.userId,
        totalViews: status.views
      })
    }

    socket.send(JSON.stringify({
      type: 'status_view_recorded',
      statusId
    }))
  } catch (error) {
    console.error('[Status] View status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to record status view'
    }))
  }
}

async function handleGetStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { statusId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const status = activeStatuses.get(statusId)

    socket.send(JSON.stringify({
      type: 'status',
      status: status || null
    }))
  } catch (error) {
    console.error('[Status] Get status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch status'
    }))
  }
}

async function handleGetUserStatuses(socket: UserStatusSocket, payload: any) {
  try {
    const { userId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const statuses = Array.from(activeStatuses.values()).filter(
      s => s.userId === userId && s.isActive
    )

    socket.send(JSON.stringify({
      type: 'user_statuses',
      statuses,
      count: statuses.length
    }))
  } catch (error) {
    console.error('[Status] Get user statuses error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch user statuses'
    }))
  }
}

async function handleGetFriendStatuses(socket: UserStatusSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    // Get user's friends
    const { data: friends } = await supabase
      .from('pals')
      .select('pal_id')
      .eq('user_id', socket.userId)

    const friendIds = friends?.map(f => f.pal_id) || []

    // Get their active statuses
    const statuses = Array.from(activeStatuses.values()).filter(
      s => friendIds.includes(s.userId) && s.isActive
    )

    socket.send(JSON.stringify({
      type: 'friend_statuses',
      statuses,
      count: statuses.length
    }))
  } catch (error) {
    console.error('[Status] Get friend statuses error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch friend statuses'
    }))
  }
}

async function handleWatchUserStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { userId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    if (!userStatusWatchers.has(userId)) {
      userStatusWatchers.set(userId, new Set())
    }

    userStatusWatchers.get(userId)!.add(socket.id)
    socket.watchingStatuses!.add(userId)

    socket.send(JSON.stringify({
      type: 'watching_user_status',
      userId
    }))

    console.log(`[Status] User ${socket.userId} watching status of ${userId}`)
  } catch (error) {
    console.error('[Status] Watch user status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to watch user status'
    }))
  }
}

async function handleUnwatchUserStatus(socket: UserStatusSocket, payload: any) {
  try {
    const { userId } = payload

    if (!socket.userId) return

    const watchers = userStatusWatchers.get(userId)
    if (watchers) {
      watchers.delete(socket.id)
    }

    socket.watchingStatuses?.delete(userId)

    socket.send(JSON.stringify({
      type: 'unwatching_user_status',
      userId
    }))
  } catch (error) {
    console.error('[Status] Unwatch user status error:', error)
  }
}

async function handleGetStatusViews(socket: UserStatusSocket, payload: any) {
  try {
    const { statusId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const status = activeStatuses.get(statusId)
    if (!status || status.userId !== socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Status not found or unauthorized'
      }))
      return
    }

    const viewers = Array.from(statusViews.get(statusId) || [])

    socket.send(JSON.stringify({
      type: 'status_views',
      statusId,
      viewers,
      totalViews: viewers.length
    }))
  } catch (error) {
    console.error('[Status] Get status views error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch status views'
    }))
  }
}

function broadcastStatusUpdate(userId: string, message: any) {
  const watchers = userStatusWatchers.get(userId)
  if (watchers) {
    watchers.forEach(socketId => {
      console.log(`[Status] Broadcasting to watcher ${socketId}`)
    })
  }
}
