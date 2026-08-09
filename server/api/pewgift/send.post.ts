import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import type { Database } from '~/types/database.types'

interface SendGiftRequest {
  postId?: string
  commentId?: string
  recipientId: string
  giftTypeId: string
  quantity: number
  message?: string
  isAnonymous: boolean
  targetType: 'post' | 'comment'
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<SendGiftRequest>(event)

  if (!body.recipientId || !body.giftTypeId || !body.quantity) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: recipientId, giftTypeId, quantity'
    })
  }
  if (body.targetType === 'post' && !body.postId) {
    throw createError({ statusCode: 400, statusMessage: 'Post ID required for post gifts' })
  }
  if (body.targetType === 'comment' && !body.commentId) {
    throw createError({ statusCode: 400, statusMessage: 'Comment ID required for comment gifts' })
  }
  if (user.id === body.recipientId) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot send gifts to yourself' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: gift, error: giftError } = await supabase
    .from('gift_catalog')
    .select('id, name, cost_credits')
    .eq('id', body.giftTypeId)
    .single()

  if (giftError || !gift) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })

  const { data: result, error: txError } = await supabase.rpc('send_pewgift', {
    p_sender_id: user.id,
    p_recipient_id: body.recipientId,
    p_gift_id: body.giftTypeId,
    p_quantity: body.quantity,
    p_stream_id: undefined,
    p_context: {
      target_type: body.targetType,
      post_id: body.postId ?? null,
      comment_id: body.commentId ?? null,
      message: body.message ?? null,
      anonymous: body.isAnonymous
    }
  })

  if (txError) throw mapGiftError(txError)

  const receipt = result as { transaction_id: string, total_cost: number, new_sender_balance: number }

  if (body.postId) {
    await supabase.from('post_gifts').insert({
      post_id: body.postId,
      sender_id: user.id,
      receiver_id: body.recipientId,
      amount: receipt.total_cost
    })
  }

  if (!body.isAnonymous) {
    await supabase.from('notifications').insert({
      recipient_id: body.recipientId,
      notifier_id: user.id,
      event_type: 'GIFT_RECEIVED',
      source_id: body.postId || body.commentId || receipt.transaction_id,
      message_text: `You received a ${gift.name}!`
    })
  }

  return {
    success: true,
    data: {
      transactionId: receipt.transaction_id,
      newBalance: receipt.new_sender_balance,
      giftName: gift.name,
      quantity: body.quantity,
      totalCost: receipt.total_cost
    },
    message: 'Gift sent successfully!'
  }
})
