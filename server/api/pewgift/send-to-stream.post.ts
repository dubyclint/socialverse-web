import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import type { Database } from '~/types/database.types'
import { assertAllowed } from '~/server/utils/staff'
import { loadHostStreamPrefs } from '~/server/utils/stream-settings'
import { broadcastToStream, liveUserCard } from '~/server/utils/stream-hub'

interface SendGiftToStreamRequest {
  streamId: string
  streamerId: string
  giftTypeId: string
  quantity?: number
  message?: string
  isAnonymous?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await assertAllowed(user.id, 'gift')
  await enforceRateLimit(event, 'pewgift:send', { limit: 30, windowMs: 60_000 }, user.id)
  const body = await readBody<SendGiftToStreamRequest>(event)

  if (!body.streamId || !body.streamerId || !body.giftTypeId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const { settings: hostPrefs } = await loadHostStreamPrefs(body.streamId)
  if (!hostPrefs.allowGifts) throw createError({ statusCode: 403, statusMessage: 'The host has turned off gifts for this stream' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: gift, error: giftError } = await supabase
    .from('gift_catalog')
    .select('id, name, tier, icon_url')
    .eq('id', body.giftTypeId)
    .single()

  if (giftError || !gift) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })

  const { data: result, error: txError } = await supabase.rpc('send_stream_gift' as never, {
    p_stream_id: body.streamId,
    p_recipient_id: body.streamerId,
    p_gift_id: body.giftTypeId,
    p_quantity: body.quantity ?? 1,
    p_message: body.message ?? null
  } as never)

  if (txError) throw mapGiftError(txError)

  const receipt = result as unknown as { transaction_id: string, total_cost: number, new_sender_balance: number, host_id: string, split: boolean, host_pct?: number }

  // Gifts sent into a live battle count towards the streamer's side.
  const { data: participant } = await supabase
    .from('stream_match_participants')
    .select('match_id, side, stream_matches!inner(status)')
    .eq('stream_id', body.streamId)
    .eq('stream_matches.status', 'LIVE')
    .maybeSingle()

  if (participant) {
    await supabase.rpc('record_match_event', {
      p_match_id: participant.match_id,
      p_actor_id: user.id,
      p_side: participant.side,
      p_kind: 'GIFT',
      p_points: receipt.total_cost,
      p_gift_id: gift.id
    })
  }

  const { data: chatRow } = await supabase.from('stream_chats').insert({
    stream_id: body.streamId,
    user_id: user.id,
    message_text: body.message || (receipt.split ? `🎁 Sent a ${gift.name} (${Number(receipt.host_pct ?? 80)}% to the host)` : `🎁 Sent a ${gift.name}!`)
  }).select('id, stream_id, user_id, message_text, is_pinned, created_at').single()
  const sender = await liveUserCard(user.id)
  broadcastToStream(body.streamId, {
    type: 'gift',
    gift: { id: gift.id, name: gift.name, tier: gift.tier, iconUrl: gift.icon_url },
    quantity: body.quantity ?? 1,
    totalCost: receipt.total_cost,
    recipientId: body.streamerId,
    sender
  })
  if (chatRow) broadcastToStream(body.streamId, { type: 'chat', message: { ...chatRow, user: sender } })

  return {
    success: true,
    data: {
      transactionId: receipt.transaction_id,
      newBalance: receipt.new_sender_balance,
      gift: { id: gift.id, name: gift.name, tier: gift.tier, iconUrl: gift.icon_url },
      totalCost: receipt.total_cost,
      split: receipt.split
    }
  }
})
