import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{
    recipientId?: string
    giftId?: string
    quantity?: number
    roomId?: string
    message?: string
  }>(event)

  if (!body.recipientId || !body.giftId) {
    throw createError({ statusCode: 400, statusMessage: 'Recipient and gift are required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: gift } = await supabase
    .from('gift_catalog')
    .select('id, name')
    .eq('id', body.giftId)
    .single()

  if (!gift) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })

  const { data: result, error } = await supabase.rpc('send_pewgift', {
    p_sender_id: user.id,
    p_recipient_id: body.recipientId,
    p_gift_id: body.giftId,
    p_quantity: body.quantity ?? 1,
    p_stream_id: undefined,
    p_context: { chat_room_id: body.roomId ?? null, message: body.message ?? null }
  })

  if (error) throw mapGiftError(error)

  const receipt = result as { transaction_id: string, total_cost: number, new_sender_balance: number }

  await supabase.from('notifications').insert({
    recipient_id: body.recipientId,
    notifier_id: user.id,
    event_type: 'GIFT_RECEIVED',
    source_id: receipt.transaction_id,
    message_text: body.message || `You received a ${gift.name}!`
  })

  return {
    success: true,
    data: {
      transactionId: receipt.transaction_id,
      recipientId: body.recipientId,
      amount: receipt.total_cost,
      newBalance: receipt.new_sender_balance
    },
    message: 'Gift sent successfully'
  }
})
