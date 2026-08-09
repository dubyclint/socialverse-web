import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import type { Database } from '~/types/database.types'

interface SendGiftRequest {
  postId: string
  giftTypeId: string
  quantity?: number
  message?: string
  isAnonymous?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<SendGiftRequest>(event)

  if (!body.postId || !body.giftTypeId) {
    throw createError({ statusCode: 400, statusMessage: 'Post ID and gift type ID are required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', body.postId)
    .single()

  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (post.user_id === user.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot send gifts to yourself' })
  }

  const { data: gift } = await supabase
    .from('gift_catalog')
    .select('id, name')
    .eq('id', body.giftTypeId)
    .single()

  if (!gift) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })

  const { data: result, error } = await supabase.rpc('send_pewgift', {
    p_sender_id: user.id,
    p_recipient_id: post.user_id,
    p_gift_id: body.giftTypeId,
    p_quantity: body.quantity ?? 1,
    p_stream_id: undefined,
    p_context: { post_id: body.postId, anonymous: body.isAnonymous ?? false }
  })

  if (error) throw mapGiftError(error)

  const receipt = result as { transaction_id: string, total_cost: number, new_sender_balance: number }

  await supabase.from('post_gifts').insert({
    post_id: body.postId,
    sender_id: user.id,
    receiver_id: post.user_id,
    amount: receipt.total_cost
  })

  await supabase.from('notifications').insert({
    recipient_id: post.user_id,
    notifier_id: body.isAnonymous ? null : user.id,
    event_type: 'GIFT_RECEIVED',
    source_id: body.postId,
    message_text: `You received a ${gift.name} on your post`
  })

  return {
    success: true,
    data: { newBalance: receipt.new_sender_balance, message: 'Gift sent successfully' }
  }
})
