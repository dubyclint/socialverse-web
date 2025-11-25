// server/ws/pewgift.ts
// PewGift WebSocket Handler

import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PewGift {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  recipientId: string
  recipientName: string
  giftType: 'pewgift' | 'superchat' | 'donation' | 'badge'
  amount: number
  currency: string
  message?: string
  streamId?: string
  isAnonymous: boolean
  createdAt: string
  metadata?: Record<string, any>
}

interface GiftLeaderboard {
  userId: string
  username: string
  avatar?: string
  totalGifts: number
  totalAmount: number
  giftCount: Record<string, number>
}

interface UserPewGiftSocket extends Socket {
  userId?: string
  streamId?: string
}

const activeStreams = new Map<string, Set<string>>()
const giftLeaderboards = new Map<string, GiftLeaderboard[]>()
const userGiftStats = new Map<string, any>()
const recentGifts = new Map<string, PewGift[]>()

const LEADERBOARD_UPDATE_INTERVAL = 10000
const RECENT_GIFTS_LIMIT = 50

export default defineWebSocketHandler({
  async open(peer, socket: UserPewGiftSocket) {
    console.log('[PewGift] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to pewgift server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserPewGiftSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break
        case 'join_stream':
          await handleJoinStream(socket, payload)
          break
        case 'leave_stream':
          await handleLeaveStream(socket, payload)
          break
        case 'send_gift':
          await handleSendGift(socket, payload)
          break
        case 'send_superchat':
          await handleSendSuperchat(socket, payload)
          break
        case 'get_leaderboard':
          await handleGetLeaderboard(socket, payload)
          break
        case 'get_recent_gifts':
          await handleGetRecentGifts(socket, payload)
          break
        case 'get_gift_stats':
          await handleGetGiftStats(socket, payload)
          break
        case 'get_user_stats':
          await handleGetUserStats(socket, payload)
          break
        case 'subscribe_leaderboard':
          await handleSubscribeLeaderboard(socket, payload)
          break
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown pewgift type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[PewGift] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process pewgift message'
      }))
    }
  },

  async close(peer, socket: UserPewGiftSocket) {
    console.log('[PewGift] Connection closed:', socket.id)
    if (socket.userId && socket.streamId) {
      const viewers = activeStreams.get(socket.streamId)
      if (viewers) {
        viewers.delete(socket.userId)
        if (viewers.size === 0) {
          activeStreams.delete(socket.streamId)
        }
      }
    }
  }
})

async function handleAuthenticate(socket: UserPewGiftSocket, payload: any) {
  try {
    const { userId } = payload
    if (!userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'User ID required' }))
      return
    }
    socket.userId = userId
    socket.send(JSON.stringify({ type: 'authenticated', userId, socketId: socket.id }))
    console.log(`[PewGift] User ${userId} authenticated`)
  } catch (error) {
    console.error('[PewGift] Auth error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }))
  }
}

async function handleJoinStream(socket: UserPewGiftSocket, payload: any) {
  try {
    const { streamId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    socket.streamId = streamId
    if (!activeStreams.has(streamId)) {
      activeStreams.set(streamId, new Set())
    }
    activeStreams.get(streamId)!.add(socket.userId)
    const leaderboard = giftLeaderboards.get(streamId) || []
    socket.send(JSON.stringify({
      type: 'joined_stream',
      streamId,
      leaderboard,
      recentGifts: recentGifts.get(streamId) || []
    }))
    console.log(`[PewGift] User ${socket.userId} joined stream ${streamId}`)
  } catch (error) {
    console.error('[PewGift] Join stream error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to join stream' }))
  }
}

async function handleLeaveStream(socket: UserPewGiftSocket, payload: any) {
  try {
    const { streamId } = payload
    if (!socket.userId) return
    const viewers = activeStreams.get(streamId)
    if (viewers) {
      viewers.delete(socket.userId)
      if (viewers.size === 0) {
        activeStreams.delete(streamId)
      }
    }
    socket.streamId = undefined
    socket.send(JSON.stringify({ type: 'left_stream', streamId }))
  } catch (error) {
    console.error('[PewGift] Leave stream error:', error)
  }
}

async function handleSendGift(socket: UserPewGiftSocket, payload: any) {
  try {
    const { recipientId, giftType, amount, message: giftMessage, streamId, isAnonymous } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: userData } = await supabase
      .from('users')
      .select('balance, username, avatar_url')
      .eq('id', socket.userId)
      .single()
    if (!userData || userData.balance < amount) {
      socket.send(JSON.stringify({ type: 'error', message: 'Insufficient balance' }))
      return
    }
    const { data: recipientData } = await supabase
      .from('users')
      .select('username')
      .eq('id', recipientId)
      .single()
    const giftId = `gift_${Date.now()}_${socket.userId}`
    const gift: PewGift = {
      id: giftId,
      senderId: socket.userId,
      senderName: isAnonymous ? 'Anonymous' : userData.username,
      senderAvatar: isAnonymous ? undefined : userData.avatar_url,
      recipientId,
      recipientName: recipientData?.username || 'Unknown',
      giftType,
      amount,
      currency: 'USD',
      message: giftMessage,
      streamId,
      isAnonymous,
      createdAt: new Date().toISOString()
    }
    await supabase
      .from('users')
      .update({ balance: userData.balance - amount })
      .eq('id', socket.userId)
    const { data: recipientBalance } = await supabase
      .from('users')
      .select('balance')
      .eq('id', recipientId)
      .single()
    await supabase
      .from('users')
      .update({ balance: (recipientBalance?.balance || 0) + (amount * 0.7) })
      .eq('id', recipientId)
    const { error: dbError } = await supabase
      .from('pewgifts')
      .insert({
        id: giftId,
        sender_id: socket.userId,
        recipient_id: recipientId,
        gift_type: giftType,
        amount,
        message: giftMessage,
        stream_id: streamId,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString()
      })
    if (dbError) throw dbError
    await updateLeaderboard(streamId || 'global', socket.userId, userData.username, amount)
    if (streamId) {
      if (!recentGifts.has(streamId)) {
        recentGifts.set(streamId, [])
      }
      const gifts = recentGifts.get(streamId)!
      gifts.unshift(gift)
      if (gifts.length > RECENT_GIFTS_LIMIT) {
        gifts.pop()
      }
    }
    socket.send(JSON.stringify({ type: 'gift_sent', gift }))
    if (streamId) {
      broadcastToStream(streamId, { type: 'new_gift', gift })
    }
    console.log(`[PewGift] Gift sent by ${socket.userId} to ${recipientId}`)
  } catch (error) {
    console.error('[PewGift] Send gift error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to send gift' }))
  }
}

async function handleSendSuperchat(socket: UserPewGiftSocket, payload: any) {
  try {
    const { message, amount, streamId, color } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: userData } = await supabase
      .from('users')
      .select('balance, username, avatar_url')
      .eq('id', socket.userId)
      .single()
    if (!userData || userData.balance < amount) {
      socket.send(JSON.stringify({ type: 'error', message: 'Insufficient balance' }))
      return
    }
    const superchatId = `superchat_${Date.now()}_${socket.userId}`
    const superchat = {
      id: superchatId,
      senderId: socket.userId,
      senderName: userData.username,
      senderAvatar: userData.avatar_url,
      message,
      amount,
      color: color || '#FFD700',
      streamId,
      createdAt: new Date().toISOString()
    }
    await supabase
      .from('users')
      .update({ balance: userData.balance - amount })
      .eq('id', socket.userId)
    await supabase
      .from('superchats')
      .insert({
        id: superchatId,
        sender_id: socket.userId,
        message,
        amount,
        color,
        stream_id: streamId,
        created_at: new Date().toISOString()
      })
    socket.send(JSON.stringify({ type: 'superchat_sent', superchat }))
    if (streamId) {
      broadcastToStream(streamId, { type: 'new_superchat', superchat })
    }
    console.log(`[PewGift] Superchat sent by ${socket.userId}`)
  } catch (error) {
    console.error('[PewGift] Send superchat error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to send superchat' }))
  }
}

async function handleGetLeaderboard(socket: UserPewGiftSocket, payload: any) {
  try {
    const { streamId = 'global', limit = 10 } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const leaderboard = giftLeaderboards.get(streamId) || []
    socket.send(JSON.stringify({
      type: 'leaderboard',
      streamId,
      leaderboard: leaderboard.slice(0, limit)
    }))
  } catch (error) {
    console.error('[PewGift] Get leaderboard error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch leaderboard' }))
  }
}

async function handleGetRecentGifts(socket: UserPewGiftSocket, payload: any) {
  try {
    const { streamId, limit = 20 } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const gifts = recentGifts.get(streamId) || []
    socket.send(JSON.stringify({ type: 'recent_gifts', gifts: gifts.slice(0, limit) }))
  } catch (error) {
    console.error('[PewGift] Get recent gifts error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch recent gifts' }))
  }
}

async function handleGetGiftStats(socket: UserPewGiftSocket, payload: any) {
  try {
    const { streamId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: stats } = await supabase
      .from('pewgifts')
      .select('gift_type, amount')
      .eq('stream_id', streamId)
    const giftStats: Record<string, any> = {}
    let totalAmount = 0
    stats?.forEach((gift: any) => {
      if (!giftStats[gift.gift_type]) {
        giftStats[gift.gift_type] = { count: 0, total: 0 }
      }
      giftStats[gift.gift_type].count++
      giftStats[gift.gift_type].total += gift.amount
      totalAmount += gift.amount
    })
    socket.send(JSON.stringify({
      type: 'gift_stats',
      stats: giftStats,
      totalAmount,
      totalGifts: stats?.length || 0
    }))
  } catch (error) {
    console.error('[PewGift] Get gift stats error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch gift stats' }))
  }
}

async function handleGetUserStats(socket: UserPewGiftSocket, payload: any) {
  try {
    const { userId } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const { data: stats } = await supabase
      .from('pewgifts')
      .select('*')
      .eq('sender_id', userId)
    let totalSent = 0
    let giftCount = 0
    stats?.forEach((gift: any) => {
      totalSent += gift.amount
      giftCount++
    })
    socket.send(JSON.stringify({
      type: 'user_stats',
      userId,
      totalSent,
      giftCount,
      averageGift: giftCount > 0 ? totalSent / giftCount : 0
    }))
  } catch (error) {
    console.error('[PewGift] Get user stats error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to fetch user stats' }))
  }
}

async function handleSubscribeLeaderboard(socket: UserPewGiftSocket, payload: any) {
  try {
    const { streamId = 'global' } = payload
    if (!socket.userId) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }))
      return
    }
    const leaderboard = giftLeaderboards.get(streamId) || []
    socket.send(JSON.stringify({
      type: 'leaderboard_subscribed',
      streamId,
      leaderboard
    }))
    console.log(`[PewGift] User ${socket.userId} subscribed to leaderboard for ${streamId}`)
  } catch (error) {
    console.error('[PewGift] Subscribe leaderboard error:', error)
    socket.send(JSON.stringify({ type: 'error', message: 'Failed to subscribe to leaderboard' }))
  }
}

async function updateLeaderboard(streamId: string, userId: string, username: string, amount: number) {
  try {
    if (!giftLeaderboards.has(streamId)) {
      giftLeaderboards.set(streamId, [])
    }
    const leaderboard = giftLeaderboards.get(streamId)!
    const existingEntry = leaderboard.find(entry => entry.userId === userId)
    if (existingEntry) {
      existingEntry.totalAmount += amount
      existingEntry.totalGifts++
    } else {
      leaderboard.push({
        userId,
        username,
        totalGifts: 1,
        totalAmount: amount,
        giftCount: {}
      })
    }
    leaderboard.sort((a, b) => b.totalAmount - a.totalAmount)
    console.log(`[PewGift] Leaderboard updated for ${streamId}`)
  } catch (error) {
    console.error('[PewGift] Update leaderboard error:', error)
  }
}

function broadcastToStream(streamId: string, message: any) {
  const viewers = activeStreams.get(streamId)
  if (viewers) {
    viewers.forEach(userId => {
      console.log(`[PewGift] Broadcasting to user ${userId} in stream ${streamId}`)
    })
  }
}
