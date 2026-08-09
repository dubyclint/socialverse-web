import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import type { Database } from '~/types/database.types'

interface SendGiftToChatRequest {
  chatId: string
  recipientId: string
  giftTypeId: string
  quantity?: number
  message?: string
  isAnonymous?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<SendGiftToChatRequest>(event)

  if (!body.chatId || !body.recipientId || !body.giftTypeId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: membership } = await supabase
    .from('chat_room_members')
    .select('room_id')
    .eq('room_id', body.chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) {
    throw createError({ statusCode: 403, statusMessage: 'You are not a member of this chat' })
  }

  const { data: gift, error: giftError } = await supabase
    .from('gift_catalog')
    .select('id, name')
    .eq('id', body.giftTypeId)
    .single()

  if (giftError || !gift) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })

  const { data: result, error: txError } = await supabase.rpc('send_pewgift', {
    p_sender_id: user.id,
    p_recipient_id: body.recipientId,
    p_gift_id: body.giftTypeId,
    p_quantity: body.quantity ?? 1,
    p_stream_id: undefined,
    p_context: { chat_room_id: body.chatId, anonymous: body.isAnonymous ?? false }
  })

  if (txError) throw mapGiftError(txError)

  const receipt = result as { transaction_id: string, total_cost: number, new_sender_balance: number }

  await supabase.from('chat_messages').insert({
    room_id: body.chatId,
    sender_id: user.id,
    message_text: body.message || `Sent a ${gift.name}!`,
    metadata: {
      kind: 'gift',
      gift_id: gift.id,
      gift_name: gift.name,
      quantity: body.quantity ?? 1,
      anonymous: body.isAnonymous ?? false,
      transaction_id: receipt.transaction_id
    }
  })

  return {
    success: true,
    data: { transactionId: receipt.transaction_id, newBalance: receipt.new_sender_balance }
  }
})
