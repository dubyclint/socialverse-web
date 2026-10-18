import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import type { Database } from '~/types/database.types'
import { getPageRole, resolveActor } from '~/server/utils/actor'
import { pageWalletTransfer } from '~/server/utils/page-wallet'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { assertAllowed } from '~/server/utils/staff'

interface SendGiftRequest {
  postId: string
  giftTypeId: string
  quantity?: number
  message?: string
  isAnonymous?: boolean
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  await assertAllowed(user.id, 'gift')
  const body = await readBody<SendGiftRequest>(event)

  if (!body.postId || !body.giftTypeId) {
    throw createError({ statusCode: 400, statusMessage: 'Post ID and gift type ID are required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: post } = await supabase
    .from('posts')
    .select('user_id, author_type, author_id')
    .eq('id', body.postId)
    .single()

  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const actor = await resolveActor(event)
  const toPageId = post.author_type === 'PAGE' && post.author_id ? post.author_id : null
  if (actor.type === 'PAGE' || toPageId) {
    return sendWithPageWallet(user.id, actor, toPageId, post.user_id, body)
  }

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

/**
 * Gifts where a Page sends (acting as the Page) or receives (a Page post) go
 * through the Page wallet. Gifts between a Page and the people who manage it
 * are refused so personal funds cannot be cycled into withdrawable earnings.
 */
async function sendWithPageWallet(
  operatorId: string,
  actor: Awaited<ReturnType<typeof resolveActor>>,
  toPageId: string | null,
  postOwnerId: string,
  body: SendGiftRequest
) {
  const service = getServiceClient()
  const fromPage = actor.type === 'PAGE'
  if (fromPage && actor.role !== 'OWNER' && actor.role !== 'MANAGER') {
    throw createError({ statusCode: 403, statusMessage: 'Only Page owners and managers can gift as the Page' })
  }

  const recipient = toPageId
    ? { type: 'PAGE' as const, id: toPageId }
    : { type: 'USER' as const, id: postOwnerId }
  if (fromPage && recipient.id === actor.id) {
    throw createError({ statusCode: 400, statusMessage: 'A Page cannot gift itself' })
  }
  if (toPageId && await getPageRole(toPageId, operatorId)) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot gift a Page you manage' })
  }
  if (fromPage && recipient.type === 'USER' && await getPageRole(actor.id, recipient.id)) {
    throw createError({ statusCode: 400, statusMessage: 'A Page cannot gift its own admins' })
  }

  const quantity = Math.trunc(Number(body.quantity ?? 1))
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Quantity must be between 1 and 100' })
  }
  const { data: gift } = await service.from('gift_catalog').select('id, name, cost_credits, is_active').eq('id', body.giftTypeId).maybeSingle()
  if (!gift || !gift.is_active) throw createError({ statusCode: 404, statusMessage: 'Gift not found' })
  const total = Number(gift.cost_credits) * quantity

  const newBalance = await pageWalletTransfer({
    fromType: fromPage ? 'PAGE' : 'USER',
    fromId: fromPage ? actor.id : operatorId,
    toType: recipient.type,
    toId: recipient.id,
    amount: total,
    debit: 'GIFT_PURCHASE',
    credit: 'GIFT_RECOVERY_REDEEM',
    operatorId,
    referenceId: gift.id,
    metadata: { context: 'post', post_id: body.postId, gift_id: gift.id, anonymous: body.isAnonymous ?? false }
  })

  await service.from('post_gifts').insert({ post_id: body.postId, sender_id: operatorId, receiver_id: postOwnerId, amount: total })
  if (postOwnerId !== operatorId) {
    await service.from('notifications').insert({
      recipient_id: postOwnerId,
      notifier_id: body.isAnonymous || fromPage ? null : operatorId,
      event_type: 'GIFT_RECEIVED',
      source_id: body.postId,
      message_text: toPageId ? `Your Page received a ${gift.name} on its post` : `You received a ${gift.name} on your post`
    })
  }

  return { success: true, data: { newBalance, message: 'Gift sent successfully' } }
}
