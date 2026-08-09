import { sendPush } from '~/push-engine'
import { PewGiftModel } from '~/server/models/pewgift'
import { NotificationModelRuntime as NotificationModel } from '~/server/models/notification'
import { RankModelRuntime as RankModel } from '~/server/models/rank'
import type { H3Event } from 'h3'

export interface SendGiftRequest {
  recipientId: string
  giftId: string
  quantity?: number
  streamId?: string
  message?: string
}

export class PewGiftController {
  static async sendGift(event: H3Event, request: SendGiftRequest) {
    const senderId = event.context?.user?.id
    if (!senderId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

    const receipt = await PewGiftModel.send({
      senderId,
      recipientId: request.recipientId,
      giftId: request.giftId,
      quantity: request.quantity,
      streamId: request.streamId,
      message: request.message
    })

    await NotificationModel.create({
      userId: request.recipientId,
      actorId: senderId,
      type: 'pewgift',
      title: 'You received a gift!',
      message: request.message || 'Sent you a gift',
      data: { giftId: receipt.transaction_id, amount: receipt.total_cost }
    })

    await RankModel.addPoints(request.recipientId, 50)
    await sendPush(request.recipientId, 'New Gift!', `You received a gift worth ${receipt.total_cost} Pewgift`)

    return { success: true, data: receipt, message: 'Gift sent successfully' }
  }

  static async getGiftHistory(event: H3Event) {
    const userId = event.context?.user?.id
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

    const [sent, received] = await Promise.all([
      PewGiftModel.getUserSentGifts(userId),
      PewGiftModel.getUserReceivedGifts(userId)
    ])

    return { success: true, data: { sent, received }, message: 'Gift history retrieved' }
  }

  static async getLeaderboard(_event: H3Event) {
    return {
      success: true,
      data: await PewGiftModel.getLeaderboard(),
      message: 'Leaderboard retrieved'
    }
  }

  static async getStats(event: H3Event) {
    const userId = event.context?.user?.id
    if (!userId) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

    return { success: true, data: await PewGiftModel.getUserStats(userId), message: 'Statistics retrieved' }
  }
}

export default PewGiftController
