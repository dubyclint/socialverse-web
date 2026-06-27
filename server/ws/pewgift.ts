// FILE: /server/ws/pewgift.ts - FIXED WITH LAZY LOADING
// ============================================================================
// PewGift WebSocket Handler
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

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
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

interface UserPewGiftSocket extends Socket {
  userId?: string
}

const giftQueue = new Map<string, PewGift[]>()
const recentGifts = new Map<string, PewGift[]>()

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
        case 'send_gift':
          await handleSendGift(socket, payload)
          break
        case 'get_gifts':
          await handleGetGifts(socket, payload)
          break
        case 'get_gift_history':
          await handleGetGiftHistory(socket, payload)
          break
        case 'get_leaderboard':
          await handleGetLeaderboard(socket, payload)
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
        message: 'Failed to process pewgift'
      }))
    }
  },

  async close(peer, socket: UserPewGiftSocket) {
    console.log('[PewGift] Connection closed:', socket.id)
  }
})

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleAuthenticate(socket: UserPewGiftSocket, payload: any) {
  try {
    socket.userId = payload.userId
    console.log('[PewGift] User authenticated:', socket.userId)
    
    socket.send(JSON.stringify({
      type: 'authenticated',
      userId: socket.userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[PewGift] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleSendGift(socket: UserPewGiftSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { recipientId, giftType, amount, currency, message } = payload

    const gift: PewGift = {
      id: crypto.randomUUID(),
      senderId: socket.userId,
      senderName: payload.senderName || 'Anonymous',
      recipientId,
      recipientName: payload.recipientName || 'Unknown',
      giftType,
      amount,
      currency,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Save to database
    const { error } = await supabase
      .from('pewgifts')
      .insert({
        id: gift.id,
        sender_id: socket.userId,
        recipient_id: recipientId,
        gift_type: giftType,
        amount,
        currency,
        message,
        status: 'completed',
        created_at: gift.createdAt
      })

    if (error) throw error

    // Add to queue for recipient
    if (!giftQueue.has(recipientId)) {
      giftQueue.set(recipientId, [])
    }
    giftQueue.get(recipientId)!.push(gift)

    // Add to recent gifts
    if (!recentGifts.has(recipientId)) {
      recentGifts.set(recipientId, [])
    }
    recentGifts.get(recipientId)!.unshift(gift)
    if (recentGifts.get(recipientId)!.length > 100) {
      recentGifts.get(recipientId)!.pop()
    }

    socket.send(JSON.stringify({
      type: 'gift_sent',
      giftId: gift.id,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[PewGift] Send gift error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send gift'
    }))
  }
}

async function handleGetGifts(socket: UserPewGiftSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const gifts = giftQueue.get(socket.userId) || []

    socket.send(JSON.stringify({
      type: 'gifts',
      gifts,
      timestamp: new Date().toISOString()
    }))

    // Clear queue after sending
    giftQueue.delete(socket.userId)
  } catch (error) {
    console.error('[PewGift] Get gifts error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch gifts'
    }))
  }
}

async function handleGetGiftHistory(socket: UserPewGiftSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { limit = 50, offset = 0 } = payload

    const { data, error } = await supabase
      .from('pewgifts')
      .select('*')
      .eq('recipient_id', socket.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'gift_history',
      gifts: data || [],
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[PewGift] Get gift history error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch gift history'
    }))
  }
}

async function handleGetLeaderboard(socket: UserPewGiftSocket, payload: any) {
  try {
    const supabase = await getWSSupabaseClient()
    const { limit = 100 } = payload

    const { data, error } = await supabase
      .from('pewgifts')
      .select('recipient_id, amount')
      .eq('status', 'completed')
      .order('amount', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Aggregate by recipient
    const leaderboard = (data || []).reduce((acc: any, gift: any) => {
      const existing = acc.find((item: any) => item.userId === gift.recipient_id)
      if (existing) {
        existing.totalAmount += gift.amount
      } else {
        acc.push({
          userId: gift.recipient_id,
          totalAmount: gift.amount
        })
      }
      return acc
    }, [])

    leaderboard.sort((a: any, b: any) => b.totalAmount - a.totalAmount)

    socket.send(JSON.stringify({
      type: 'leaderboard',
      leaderboard: leaderboard.slice(0, limit),
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[PewGift] Get leaderboard error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch leaderboard'
    }))
  }
}
