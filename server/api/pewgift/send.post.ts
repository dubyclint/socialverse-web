import { supabase } from '~/utils/supabase'

interface PewGiftRequest {
  senderId: string
  recipientId: string
  messageId?: string
  postId?: string
  commentId?: string
  amount: number
  senderFee: number
  receiverFee: number
}

interface UserWallet {
  id: string
  user_id: string
  pew_balance: number
  locked_balance: number
  is_locked: boolean
  updated_at: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<PewGiftRequest>(event)
    
    // Validate required fields
    if (!body.senderId || !body.recipientId || !body.amount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: senderId, recipientId, amount'
      })
    }

    // Validate minimum amount (1.2 USDT equivalent)
    if (body.amount < 1.2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Minimum PewGift amount is 1.2 USDT worth of PEW'
      })
    }

    // Calculate total deduction (amount + sender fee)
    const totalDeduction = body.amount + body.senderFee
    const minimumRequired = 1.3 // 1.2 + minimum fee buffer

    // Check if sender and recipient are different
    if (body.senderId === body.recipientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot send PewGift to yourself'
      })
    }

    // Start transaction
    const { data: senderWallet, error: senderError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', body.senderId)
      .single()

    if (senderError || !senderWallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sender wallet not found'
      })
    }

    // Check if sender's balance is locked
    if (senderWallet.is_locked) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Your balance is locked. Please unlock it in settings to send PewGifts.'
      })
    }

    // Check sufficient balance
    if (senderWallet.pew_balance < minimumRequired) {
      throw createError({
        statusCode: 400,
        statusMessage: `Insufficient PEW Balance. You need at least ${minimumRequired} USDT worth of PEW to send a gift.`
      })
    }

    // Get recipient wallet
    const { data: recipientWallet, error: recipientError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', body.recipientId)
      .single()

    if (recipientError || !recipientWallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Recipient wallet not found'
      })
    }

    // Calculate final amounts
    const netAmountToRecipient = body.amount - body.receiverFee
    
    // Update sender balance
    const { error: senderUpdateError } = await supabase
      .from('user_wallets')
      .update({
        pew_balance: senderWallet.pew_balance - totalDeduction,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', body.senderId)

    if (senderUpdateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update sender balance'
      })
    }

    // Update recipient balance (only if not locked)
    if (!recipientWallet.is_locked) {
      const { error: recipientUpdateError } = await supabase
        .from('user_wallets')
        .update({
          pew_balance: recipientWallet.pew_balance + netAmountToRecipient,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', body.recipientId)

      if (recipientUpdateError) {
        // Rollback sender balance if recipient update fails
        await supabase
          .from('user_wallets')
          .update({
            pew_balance: senderWallet.pew_balance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', body.senderId)

        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update recipient balance'
        })
      }
    } else {
      // If recipient balance is locked, add to locked_balance instead
      const { error: recipientLockedUpdateError } = await supabase
        .from('user_wallets')
        .update({
          locked_balance: recipientWallet.locked_balance + netAmountToRecipient,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', body.recipientId)

      if (recipientLockedUpdateError) {
        // Rollback sender balance
        await supabase
          .from('user_wallets')
          .update({
            pew_balance: senderWallet.pew_balance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', body.senderId)

        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update recipient locked balance'
        })
      }
    }

    // Record the PewGift transaction
    const { data: pewGiftRecord, error: recordError } = await supabase
      .from('pew_gifts')
      .insert({
        sender_id: body.senderId,
        recipient_id: body.recipientId,
        message_id: body.messageId,
        post_id: body.postId,
        comment_id: body.commentId,
        amount: body.amount,
        sender_fee: body.senderFee,
        receiver_fee: body.receiverFee,
        net_amount: netAmountToRecipient,
        transaction_type: body.messageId ? 'chat' : body.postId ? 'post' : 'comment',
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) {
      console.error('Failed to record PewGift transaction:', recordError)
      // Note: We don't rollback here as the money transfer was successful
      // This is just for record keeping
    }

    // Record transaction fees (for platform revenue tracking)
    const totalFees = body.senderFee + body.receiverFee
    const { error: feeRecordError } = await supabase
      .from('platform_fees')
      .insert({
        transaction_id: pewGiftRecord?.id,
        transaction_type: 'pewgift',
        fee_amount: totalFees,
        sender_id: body.senderId,
        recipient_id: body.recipientId,
        created_at: new Date().toISOString()
      })

    if (feeRecordError) {
      console.error('Failed to record platform fees:', feeRecordError)
    }

    // Create notification for recipient
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: body.recipientId,
        type: 'pewgift_received',
        title: 'PewGift Received! 💎',
        message: `You received ${body.amount} USDT worth of PEW as a gift!`,
        data: {
          senderId: body.senderId,
          amount: body.amount,
          netAmount: netAmountToRecipient,
          messageId: body.messageId,
          postId: body.postId,
          commentId: body.commentId
        },
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Failed to create notification:', notificationError)
    }

    // Return success response
    return {
      success: true,
      message: 'PewGift sent successfully! 💎',
      data: {
        transactionId: pewGiftRecord?.id,
        amount: body.amount,
        netAmount: netAmountToRecipient,
        senderFee: body.senderFee,
        receiverFee: body.receiverFee,
        senderNewBalance: senderWallet.pew_balance - totalDeduction,
        recipientNewBalance: recipientWallet.is_locked 
          ? recipientWallet.pew_balance 
          : recipientWallet.pew_balance + netAmountToRecipient,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('PewGift API Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error while processing PewGift'
    })
  }
})
