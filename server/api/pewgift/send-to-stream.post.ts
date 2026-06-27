// server/api/pewgift/send-to-stream.post.ts - NEW FILE FOR STREAMING GIFTS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface SendGiftToStreamRequest {
  streamId: string
  streamerId: string
  giftTypeId: string
  quantity: number
  message?: string
  isAnonymous: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody<SendGiftToStreamRequest>(event)

    if (!body.streamId || !body.streamerId || !body.giftTypeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Get gift type
    const { data: giftType, error: giftError } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('id', body.giftTypeId)
      .single()

    if (giftError || !giftType) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Gift type not found'
      })
    }

    const totalCost = giftType.price_in_credits * body.quantity

    // Check balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('pew_balance, locked_balance')
      .eq('user_id', user.id)
      .single()

    if (!wallet || (wallet.pew_balance - (wallet.locked_balance || 0)) < totalCost) {
      throw createError({
        statusCode: 402,
        statusMessage: 'Insufficient balance'
      })
    }

    // Process stream gift
    const { data: transaction, error: txError } = await supabase
      .rpc('send_stream_pewgift', {
        sender_id_param: user.id,
        streamer_id_param: body.streamerId,
        stream_id_param: body.streamId,
        gift_type_id_param: body.giftTypeId,
        quantity_param: body.quantity,
        total_cost_param: totalCost,
        message_param: body.message || null,
        is_anonymous_param: body.isAnonymous
      })

    if (txError) throw txError

    // Broadcast gift animation to stream viewers
    await supabase
      .from('stream_gifts_broadcast')
      .insert({
        stream_id: body.streamId,
        gift_id: transaction.id,
        sender_name: body.isAnonymous ? 'Anonymous' : user.user_metadata?.name,
        sender_avatar: body.isAnonymous ? null : user.user_metadata?.avatar_url,
        gift_name: giftType.name,
        gift_emoji: giftType.emoji,
        quantity: body.quantity,
        message: body.message || null,
        created_at: new Date().toISOString()
      })

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        newBalance: transaction.new_sender_balance
      }
    }
  } catch (error: any) {
    throw error
  }
})
