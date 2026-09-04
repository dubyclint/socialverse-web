import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import type { Database } from '~/types/database.types'

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
  await enforceRateLimit(event, 'pewgift:send', { limit: 30, windowMs: 60_000 }, user.id)
  const body = await readBody<SendGiftToStreamRequest>(event)

  if (!body.streamId || !body.streamerId || !body.giftTypeId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: gift, error: giftError } = await supabase
    .from('gift_catalog')
    .select('id, name, tier, icon_url')
    .eq('id', body.giftTypeId)
    .single()

  if (giftError || !gift) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })

  const { data: result, error: txError } = await supabase.rpc('send_pewgift', {
    p_sender_id: user.id,
    p_recipient_id: body.streamerId,
    p_gift_id: body.giftTypeId,
    p_quantity: body.quantity ?? 1,
    p_stream_id: body.streamId,
    p_context: { anonymous: body.isAnonymous ?? false, message: body.message ?? null }
  })

  if (txError) throw mapGiftError(txError)

  const receipt = result as { transaction_id: string, total_cost: number, new_sender_balance: number }

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

  await supabase.from('stream_chats').insert({
    stream_id: body.streamId,
    user_id: user.id,
    message_text: body.message || `Sent a ${gift.name}!`
  })

  return {
    success: true,
    data: {
      transactionId: receipt.transaction_id,
      newBalance: receipt.new_sender_balance,
      gift: { id: gift.id, name: gift.name, tier: gift.tier, iconUrl: gift.icon_url },
      totalCost: receipt.total_cost
    }
  }
})
