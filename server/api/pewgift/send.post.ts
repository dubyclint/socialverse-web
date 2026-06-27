// server/api/pewgift/send.post.ts - COMPLETE FIXED VERSION
// ============================================================================
// SEND GIFT TO POST/COMMENT - FULLY FUNCTIONAL WITH ERROR HANDLING
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import { defineEventHandler, readBody, createError, getHeader } from 'h3'

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
  try {
    // Authenticate user
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<SendGiftRequest>(event)

    // Validate required fields
    if (!body.recipientId || !body.giftTypeId || !body.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: recipientId, giftTypeId, quantity'
      })
    }

    if (body.targetType === 'post' && !body.postId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Post ID required for post gifts'
      })
    }

    if (body.targetType === 'comment' && !body.commentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment ID required for comment gifts'
      })
    }

    if (body.quantity < 1 || body.quantity > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quantity must be between 1 and 100'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Get gift type details
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

    // Calculate total cost
    const totalCost = giftType.price_in_credits * body.quantity

    // Check sender balance
    const { data: senderWallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('pew_balance, locked_balance')
      .eq('user_id', user.id)
      .single()

    if (walletError || !senderWallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet not found'
      })
    }

    const availableBalance = senderWallet.pew_balance - (senderWallet.locked_balance || 0)

    if (availableBalance < totalCost) {
      throw createError({
        statusCode: 402,
        statusMessage: `Insufficient balance. Need ${totalCost} PEW, have ${availableBalance} PEW`
      })
    }

    // Prevent self-gifting
    if (user.id === body.recipientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot send gifts to yourself'
      })
    }

    // Create gift transaction
    const { data: transaction, error: txError } = await supabase
      .rpc('send_pewgift_transaction', {
        sender_id_param: user.id,
        recipient_id_param: body.recipientId,
        gift_type_id_param: body.giftTypeId,
        quantity_param: body.quantity,
        total_cost_param: totalCost,
        post_id_param: body.postId || null,
        comment_id_param: body.commentId || null,
        message_param: body.message || null,
        is_anonymous_param: body.isAnonymous,
        target_type_param: body.targetType
      })

    if (txError) {
      console.error('Transaction error:', txError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to process gift transaction'
      })
    }

    // Create notification for recipient
    if (!body.isAnonymous) {
      await supabase
        .from('notifications')
        .insert({
          user_id: body.recipientId,
          type: 'gift_received',
          title: `Received a gift from ${user.user_metadata?.name || 'Someone'}`,
          message: `You received a ${giftType.name} gift!`,
          data: {
            gift_id: transaction.id,
            sender_id: user.id,
            gift_type: giftType.name
          },
          read: false
        })
    }

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        newBalance: transaction.new_sender_balance,
        giftName: giftType.name,
        quantity: body.quantity,
        totalCost: totalCost
      },
      message: 'Gift sent successfully!'
    }
  } catch (error: any) {
    console.error('Send gift error:', error)
    throw error
  }
})
