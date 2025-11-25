// server/controllers/pewgift-controller.ts
// CORRECTED - Import and use PewGiftModel

import { supabase } from '~/server/utils/database'
import { sendPush } from '~/push-engine'
import { PewGiftModel } from '../models/pewgift'
import { NotificationModel } from '../models/notification'
import { RankModel } from '../models/rank'
import type { H3Event } from 'h3'

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

export class PewGiftController {
  /**
   * Send gift to user
   */
  static async sendGift(event: H3Event, request: SendGiftRequest) {
    try {
      const senderId = event.context.user?.id

      if (!senderId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE PewGiftModel - Create transaction
      const transaction = await PewGiftModel.createTransaction({
        senderId,
        recipientId: request.recipientId,
        giftId: request.giftType || 'pewgift',
        targetType: request.postId ? 'post' : 'profile',
        targetId: request.postId || request.recipientId,
        quantity: 1,
        message: request.message,
        amount: request.amount,
        giftType: request.giftType || 'pewgift',
        status: 'completed'
      })

      // ✅ USE NotificationModel - Notify recipient
      await NotificationModel.create({
        userId: request.recipientId,
        actorId: senderId,
        type: 'pewgift',
        title: 'You received a gift!',
        message: `${request.message || 'Sent you a gift'}`,
        data: {
          giftId: transaction.id,
          amount: request.amount,
          giftType: request.giftType
        }
      })

      // ✅ USE RankModel - Award points to recipient
      await RankModel.addPoints(request.recipientId, 50)

      // Send push notification
      await sendPush(request.recipientId, {
        title: 'New Gift!',
        body: `You received a gift worth ${request.amount} credits`,
        data: { giftId: transaction.id }
      })

      return {
        success: true,
        data: transaction,
        message: 'Gift sent successfully'
      }
    } catch (error) {
      console.error('[PewGiftController] Send gift error:', error)
      throw error
    }
  }

  /**
   * Get user's gift history
   */
  static async getGiftHistory(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE PewGiftModel
      const sent = await PewGiftModel.getUserSentGifts(userId)
      const received = await PewGiftModel.getUserReceivedGifts(userId)

      return {
        success: true,
        data: { sent, received },
        message: 'Gift history retrieved'
      }
    } catch (error) {
      console.error('[PewGiftController] Get gift history error:', error)
      throw error
    }
  }

  /**
   * Get gift leaderboard
   */
  static async getLeaderboard(event: H3Event) {
    try {
      // ✅ USE PewGiftModel
      const leaderboard = await PewGiftModel.getLeaderboard()

      return {
        success: true,
        data: leaderboard,
        message: 'Leaderboard retrieved'
      }
    } catch (error) {
      console.error('[PewGiftController] Get leaderboard error:', error)
      throw error
    }
  }

  /**
   * Get gift statistics
   */
  static async getStats(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE PewGiftModel
      const stats = await PewGiftModel.getUserStats(userId)

      return {
        success: true,
        data: stats,
        message: 'Statistics retrieved'
      }
    } catch (error) {
      console.error('[PewGiftController] Get stats error:', error)
      throw error
    }
  }
}

export default PewGiftController
