// server/controllers/status-controller.ts
// CORRECTED - Import and use StatusModel

import type { H3Event } from 'h3'
import { StatusModel } from '../models/status'
const Status: any = (StatusModel as any) || {}
import { NotificationModelRuntime as NotificationModel } from '../models/notification'

export class StatusController {
  /**
   * Create status
   */
  static async createStatus(event: H3Event, data: any) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StatusModel
  const status = await Status.create({
        userId,
        content: data.content,
        mediaType: data.mediaType,
        mediaUrl: data.mediaUrl,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        expiresIn: data.expiresIn
      })

      return {
        success: true,
        data: status,
        message: 'Status created'
      }
    } catch (error) {
      console.error('[StatusController] Create status error:', error)
      throw error
    }
  }

  /**
   * Get user statuses
   */
  static async getUserStatuses(_event: H3Event, userId: string) {
    try {
      // ✅ USE StatusModel
  const statuses = await Status.getUserStatuses(userId)

      return {
        success: true,
        data: statuses,
        message: 'Statuses retrieved'
      }
    } catch (error) {
      console.error('[StatusController] Get user statuses error:', error)
      throw error
    }
  }

  /**
   * Get friend statuses
   */
  static async getFriendStatuses(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StatusModel
  const statuses = await Status.getFriendStatuses(userId)

      return {
        success: true,
        data: statuses,
        message: 'Friend statuses retrieved'
      }
    } catch (error) {
      console.error('[StatusController] Get friend statuses error:', error)
      throw error
    }
  }

  /**
   * View status
   */
  static async viewStatus(event: H3Event, statusId: string) {
    try {
      const viewerId = event.context.user?.id

      if (!viewerId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StatusModel
  const status = await Status.recordView(statusId, viewerId)

      // Handle nullable return and both snake_case/camelCase shapes
      if (!status) {
        return {
          success: false,
          error: 'Status not found'
        }
      }

      const ownerId = (status as any).user_id || (status as any).userId

      // ✅ USE NotificationModel - Notify status owner
      await NotificationModel.create({
        userId: ownerId,
        actorId: viewerId,
        type: 'system',
        title: 'Status Viewed',
        message: 'Someone viewed your status',
        data: { statusId }
      })

      return {
        success: true,
        data: status,
        message: 'Status view recorded'
      }
    } catch (error) {
      console.error('[StatusController] View status error:', error)
      throw error
    }
  }

  /**
   * Delete status
   */
  static async deleteStatus(event: H3Event, statusId: string) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StatusModel
  await Status.delete(statusId, userId)

      return {
        success: true,
        message: 'Status deleted'
      }
    } catch (error) {
      console.error('[StatusController] Delete status error:', error)
      throw error
    }
  }
}

export default StatusController
