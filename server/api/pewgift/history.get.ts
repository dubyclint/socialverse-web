import { supabase } from '~/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.userId as string
    const limit = parseInt(query.limit as string) || 20
    const offset = parseInt(query.offset as string) || 0

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Get PewGift transaction history
    const { data: transactions, error } = await supabase
      .from('pew_gifts')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch transaction history'
      })
    }

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.sender_id === userId ? 'sent' : 'received',
      amount: parseFloat(tx.amount),
      netAmount: parseFloat(tx.net_amount),
      senderFee: parseFloat(tx.sender_fee),
      receiverFee: parseFloat(tx.receiver_fee),
      senderId: tx.sender_id,
      recipientId: tx.recipient_id,
      transactionType: tx.transaction_type,
      messageId: tx.message_id,
      postId: tx.post_id,
      commentId: tx.comment_id,
      status: tx.status,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at
    }))

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('pew_gifts')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)

    if (countError) {
      console.error('Failed to get transaction count:', countError)
    }

    return {
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    }

  } catch (error) {
    console.error('History API Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transaction history'
    })
  }
})
