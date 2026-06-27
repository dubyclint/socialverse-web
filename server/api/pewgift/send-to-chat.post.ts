// server/api/pewgift/send-to-chat.post.ts - NEW FILE FOR CHAT GIFTS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface SendGiftToChatRequest {
  chatId: string
  recipientId: string
  giftTypeId: string
  quantity: number
  message?: string
  isAnonymous: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody<SendGiftToChatRequest>(event)

    if (!body.chatId || !body.recipientId || !body.giftTypeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Verify user is part of chat
    const { data: chatMember } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', body.chatId)
      .eq('user_id', user.id)
      .single()

    if (!chatMember) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not a member of this chat'
      })
    }

    // Get gift type
    const { data: giftType } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('id', body.giftTypeId)
      .single()

    if (!giftType) {
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

    // Process chat gift
    const { data: transaction, error: txError } = await supabase
      .rpc('send_chat_pewgift', {
        sender_id_param: user.id,
        recipient_id_param: body.recipientId,
        chat_id_param: body.chatId,
        gift_type_id_param: body.giftTypeId,
        quantity_param: body.quantity,
        total_cost_param: totalCost,
        message_param: body.message || null,
        is_anonymous_param: body.isAnonymous
      })

    if (txError) throw txError

    // Create chat message with gift
    await supabase
      .from('chat_messages')
      .insert({
        chat_id: body.chatId,
        sender_id: user.id,
        message_type: 'gift',
        content: body.message || `Sent a ${giftType.name}!`,
        gift_id: transaction.id,
        gift_type_id: body.giftTypeId,
        is_anonymous: body.isAnonymous
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
