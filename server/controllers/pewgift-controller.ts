// server/controllers/pewgift-controller.ts
// ============================================================================
// CONSOLIDATED PEWGIFT CONTROLLER
// Merges: pewgift-controller.js + pewgift-push-controller.js
// ============================================================================

import { supabase } from '~/server/utils/database'
import { sendPush } from '~/push-engine'
import type { H3Event } from 'h3'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SendGiftRequest {
  recipientId: string
  postId?: string
  commentId?: string
  amount: number
  giftType?: string
  message?: string
}

export interface GiftSplit {
  toCommenter: number
  toPostOwner: number
}

// ============================================================================
// PEWGIFT CONTROLLER
// ============================================================================

export class PewGiftController {
  /**
   * Send a gift
   */
  static async sendGift(event: H3Event) {
    try {
      const body = await readBody(event)
      const { recipientId, postId, commentId, amount, giftType, message } = body as SendGiftRequest
      const senderId = event.context.user?.id
      const senderName = event.context.user?.username

      if (!senderId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      // Input validation
      if (!recipientId || !amount || amount <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid input parameters' })
      }

      // Prevent self-gifting
      if (senderId === recipientId) {
        throw createError({ statusCode: 400, statusMessage: 'Cannot send gift to yourself' })
      }

      // Check sender's balance
      const { data: senderWallet } = await supabase
        .from('user_wallets')
        .select('balances')
        .eq('user_id', senderId)
        .single()

      if (!senderWallet || !senderWallet.balances.usdc || senderWallet.balances.usdc < amount) {
        throw createError({ statusCode: 400, statusMessage: 'Insufficient balance' })
      }

      // Calculate split if comment
      let split: GiftSplit = { toCommenter: 0, toPostOwner: amount }
      if (commentId) {
        split.toCommenter = amount * 0.7
        split.toPostOwner = amount * 0.3
      }

      // Create gift transaction
      const { data: gift, error } = await supabase
        .from('pewgifts')
        .insert({
          sender_id: senderId,
          sender_name: senderName,
          recipient_id: recipientId,
          post_id: postId || null,
          comment_id: commentId || null,
          amount,
          gift_type: giftType || 'standard',
          message: message || null,
          split,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Deduct from sender's balance
      await supabase
        .from('user_wallets')
        .update({
          balances: {
            ...senderWallet.balances,
            usdc: senderWallet.balances.usdc - amount
          }
        })
        .eq('user_id', senderId)

      // Add to recipient's balance
      const { data: recipientWallet } = await supabase
        .from('user_wallets')
        .select('balances')
        .eq('user_id', recipientId)
        .single()

      if (recipientWallet) {
        await supabase
          .from('user_wallets')
          .update({
            balances: {
              ...recipientWallet.balances,
              usdc: recipientWallet.balances.usdc + split.toPostOwner
            }
          })
          .eq('user_id', recipientId)
      }

      // Send push notification to recipient
      const { data: recipient } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', recipientId)
        .single()

      if (recipient?.device_token) {
        await sendPush(
          recipient.device_token,
          '🎁 You received a gift!',
          `${senderName} sent you ${amount} USDC`
        )
      }

      // If comment, also notify commenter
      if (commentId) {
        const { data: comment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', commentId)
          .single()

        if (comment?.user_id && comment.user_id !== recipientId) {
          const { data: commenter } = await supabase
            .from('users')
            .select('device_token')
            .eq('id', comment.user_id)
            .single()

          if (commenter?.device_token) {
            await sendPush(
              commenter.device_token,
              '🎁 Your comment received a gift!',
              `${senderName} sent ${split.toCommenter} USDC to your comment`
            )
          }

          // Add to commenter's balance
          const { data: commenterWallet } = await supabase
            .from('user_wallets')
            .select('balances')
            .eq('user_id', comment.user_id)
            .single()

          if (commenterWallet) {
            await supabase
              .from('user_wallets')
              .update({
                balances: {
                  ...commenterWallet.balances,
                  usdc: commenterWallet.balances.usdc + split.toCommenter
                }
              })
              .eq('user_id', comment.user_id)
          }
        }
      }

      return { success: true, data: gift, split }
    } catch (error: any) {
      console.error('Error sending gift:', error)
      throw error
    }
  }

  /**
   * Get user's received gifts
   */
  static async getReceivedGifts(event: H3Event) {
    try {
      const userId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const { data: gifts, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('recipient_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: gifts || [] }
    } catch (error: any) {
      console.error('Error getting received gifts:', error)
      throw error
    }
  }

  /**
   * Get user's sent gifts
   */
  static async getSentGifts(event: H3Event) {
    try {
      const userId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const { data: gifts, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('sender_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: gifts || [] }
    } catch (error: any) {
      console.error('Error getting sent gifts:', error)
      throw error
    }
  }

  /**
   * Get post gifts
   */
  static async getPostGifts(event: H3Event) {
    try {
      const { postId } = getRouterParams(event)
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      const { data: gifts, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('post_id', postId)
        .is('comment_id', null)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: gifts || [] }
    } catch (error: any) {
      console.error('Error getting post gifts:', error)
      throw error
    }
  }

  /**
   * Get comment gifts
   */
  static async getCommentGifts(event: H3Event) {
    try {
      const { commentId } = getRouterParams(event)
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      const { data: gifts, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('comment_id', commentId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: gifts || [] }
    } catch (error: any) {
      console.error('Error getting comment gifts:', error)
      throw error
    }
  }

  /**
   * Get gift statistics
   */
  static async getGiftStats(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const { data: sentGifts, error: sentError } = await supabase
        .from('pewgifts')
        .select('amount')
        .eq('sender_id', userId)

      const { data: receivedGifts, error: receivedError } = await supabase
        .from('pewgifts')
        .select('amount')
        .eq('recipient_id', userId)

      if (sentError || receivedError) throw sentError || receivedError

      const totalSent = (sentGifts || []).reduce((sum, gift) => sum + gift.amount, 0)
      const totalReceived = (receivedGifts || []).reduce((sum, gift) => sum + gift.amount, 0)

      return {
        success: true,
        data: {
          total_sent: totalSent,
          total_received: totalReceived,
          gifts_sent_count: sentGifts?.length || 0,
          gifts_received_count: receivedGifts?.length || 0
        }
      }
    } catch (error: any) {
      console.error('Error getting gift stats:', error)
      throw error
    }
  }
}
