// PewGift WebSocket handler. Gifts are priced and settled by the money-core
// `send_pewgift` function; the socket only carries intent and broadcasts
// receipts.

import { getWSSupabaseClient } from '~/server/gateway/socket/ws-supabase'

interface GiftPeer {
  send: (payload: string) => unknown
  context: Record<string, unknown>
}

interface SendGiftPayload {
  recipientId: string
  giftId: string
  quantity?: number
  streamId?: string
  message?: string
}

interface GiftReceipt {
  transaction_id: string
  total_cost: number
  new_sender_balance: number
}

const send = (peer: GiftPeer, type: string, payload: Record<string, unknown> = {}) => {
  peer.send(JSON.stringify({ type, ...payload, timestamp: new Date().toISOString() }))
}

const userIdOf = (peer: GiftPeer): string | undefined =>
  typeof peer.context.userId === 'string' ? peer.context.userId : undefined

export default defineWebSocketHandler({
  open(peer) {
    send(peer as unknown as GiftPeer, 'connection', { message: 'Connected to pewgift server' })
  },

  async message(rawPeer, rawMessage) {
    const peer = rawPeer as unknown as GiftPeer

    let parsed: { type?: string, payload?: unknown }
    try {
      parsed = JSON.parse(rawMessage.text())
    } catch {
      return send(peer, 'error', { message: 'Malformed payload' })
    }

    try {
      switch (parsed.type) {
        case 'authenticate':
          return await handleAuthenticate(peer, parsed.payload as { token: string })
        case 'send_gift':
          return await handleSendGift(peer, parsed.payload as SendGiftPayload)
        case 'get_gift_history':
          return await handleGetGiftHistory(peer, parsed.payload as { limit?: number, offset?: number })
        default:
          return send(peer, 'error', { message: `Unknown pewgift type: ${parsed.type}` })
      }
    } catch (error) {
      console.error('[PewGift] Message error:', error)
      send(peer, 'error', { message: 'Failed to process pewgift' })
    }
  },

  close() {
    console.log('[PewGift] Connection closed')
  }
})

/** Identity comes from the Supabase access token, never from the client payload. */
async function handleAuthenticate(peer: GiftPeer, payload: { token: string }) {
  const supabase = await getWSSupabaseClient()
  const { data, error } = await supabase.auth.getUser(payload?.token)

  if (error || !data.user) {
    return send(peer, 'error', { message: 'Authentication failed' })
  }

  peer.context.userId = data.user.id
  send(peer, 'authenticated', { userId: data.user.id })
}

async function handleSendGift(peer: GiftPeer, payload: SendGiftPayload) {
  const userId = userIdOf(peer)
  if (!userId) return send(peer, 'error', { message: 'Not authenticated' })
  if (!payload?.recipientId || !payload?.giftId) {
    return send(peer, 'error', { message: 'Recipient and gift are required' })
  }

  const supabase = await getWSSupabaseClient()
  const { data, error } = await supabase.rpc('send_pewgift', {
    p_sender_id: userId,
    p_recipient_id: payload.recipientId,
    p_gift_id: payload.giftId,
    p_quantity: payload.quantity ?? 1,
    p_stream_id: payload.streamId,
    p_context: { message: payload.message ?? null }
  })

  if (error) return send(peer, 'error', { message: error.message })

  const receipt = data as GiftReceipt
  send(peer, 'gift_sent', {
    giftId: receipt.transaction_id,
    totalCost: receipt.total_cost,
    newBalance: receipt.new_sender_balance
  })
}

async function handleGetGiftHistory(peer: GiftPeer, payload: { limit?: number, offset?: number }) {
  const userId = userIdOf(peer)
  if (!userId) return send(peer, 'error', { message: 'Not authenticated' })

  const limit = payload?.limit ?? 50
  const offset = payload?.offset ?? 0
  const supabase = await getWSSupabaseClient()

  const { data, error } = await supabase
    .from('gift_transactions')
    .select('id, gift_id, sender_id, recipient_id, credit_value, stream_id, created_at')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return send(peer, 'error', { message: error.message })

  send(peer, 'gift_history', { gifts: data || [] })
}
