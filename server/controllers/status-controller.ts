// server/controllers/status-controller.ts - Status Management Controller
// ============================================================================

import type { H3Event } from 'h3'
import { getRouterParam, getQuery, readBody } from 'h3'
import { UserStatus } from '../models/userStatus'
import { StatusView } from '../models/status-view'
import { UserContact } from '../models/user-contact'
import { User } from '../models/profile'
import { supabase } from '../utils/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StatusData {
  id: string
  user_id: string
  content: string
  media_type: 'text' | 'image' | 'video' | 'audio'
  media_url?: string
  background_color?: string
  text_color?: string
  is_active: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

export interface StatusResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface MediaMetadata {
  duration?: number
  width?: number
  height?: number
  size: number
  format: string
}

// ============================================================================
// STATUS CONTROLLER
// ============================================================================

export class StatusController {
  /**
   * Create new status
   * POST /api/status
   */
  static async createStatus(event: H3Event): Promise<StatusResponse> {
    try {
      const userId = event.context.user?.id
      const body = await readBody(event)
      const {
        content,
        mediaType = 'text',
        backgroundColor = '#000000',
        textColor = '#ffffff'
      } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      // Check active status count
      const activeStatusCount = await UserStatus.count({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: { $gt: new Date() }
        }
      })

      if (activeStatusCount >= 30) {
        return {
          success: false,
          error: 'Maximum 30 active statuses allowed'
        }
      }

      // Validate content
      if (mediaType === 'text' && (!content || content.trim().length === 0)) {
        return {
          success: false,
          error: 'Text content is required for text status'
        }
      }

      if (mediaType === 'text' && content.length > 500) {
        return {
          success: false,
          error: 'Text status must be 500 characters or less'
        }
      }

      let mediaUrl = null
      let mediaMetadata: Partial<MediaMetadata> = {}

      // Handle media upload if present
      if (body.file && ['image', 'video', 'audio'].includes(mediaType)) {
        mediaUrl = await this.processMediaFile(body.file, mediaType)
        mediaMetadata = await this.getMediaMetadata(body.file, mediaType)
      }

      // Validate media constraints
      if (mediaType === 'video' && mediaMetadata.duration && mediaMetadata.duration > 10) {
        return {
          success: false,
          error: 'Video status must be 10 seconds or less'
        }
      }

      if (mediaType === 'image' && mediaMetadata.size && mediaMetadata.size > 5242880) {
        return {
          success: false,
          error: 'Image must be 5MB or less'
        }
      }

      // Create status
      const status = await UserStatus.create({
        user_id: userId,
        content,
        media_type: mediaType,
        media_url: mediaUrl,
        background_color: backgroundColor,
        text_color: textColor,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      })

      return {
        success: true,
        data: status,
        message: 'Status created successfully'
      }
    } catch (error) {
      console.error('Error creating status:', error)
      return {
        success: false,
        message: 'Error creating status'
      }
    }
  }

  /**
   * Get user's statuses
   * GET /api/status/user/:userId
   */
  static async getUserStatuses(event: H3Event): Promise<StatusResponse> {
    try {
      const userId = getRouterParam(event, 'userId')
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 20
      const offset = parseInt(query.offset as string) || 0

      const statuses = await UserStatus.findAll({
        where: {
          user_id: userId,
          is_active: true,
          expires_at: { $gt: new Date() }
        },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      })

      return {
        success: true,
        data: {
          statuses,
          total: statuses.length
        }
      }
    } catch (error) {
      console.error('Error getting user statuses:', error)
      return {
        success: false,
        message: 'Error retrieving statuses'
      }
    }
  }

  /**
   * Delete status
   * DELETE /api/status/:statusId
   */
  static async deleteStatus(event: H3Event): Promise<StatusResponse> {
    try {
      const userId = event.context.user?.id
      const statusId = getRouterParam(event, 'statusId')

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const status = await UserStatus.findOne({
        where: { id: statusId, user_id: userId }
      })

      if (!status) {
        return {
          success: false,
          message: 'Status not found'
        }
      }

      await UserStatus.destroy({
        where: { id: statusId }
      })

      return {
        success: true,
        message: 'Status deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting status:', error)
      return {
        success: false,
        message: 'Error deleting status'
      }
    }
  }

  /**
   * Record status view
   * POST /api/status/:statusId/view
   */
  static async recordStatusView(event: H3Event): Promise<StatusResponse> {
    try {
      const userId = event.context.user?.id
      const statusId = getRouterParam(event, 'statusId')

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const view = await StatusView.create({
        status_id: statusId,
        viewed_by: userId,
        viewed_at: new Date().toISOString()
      })

      return {
        success: true,
        data: view,
        message: 'View recorded'
      }
    } catch (error) {
      console.error('Error recording status view:', error)
      return {
        success: false,
        message: 'Error recording view'
      }
    }
  }

  /**
   * Helper: Process media file
   */
  private static async processMediaFile(file: any, mediaType: string): Promise<string> {
    // Implementation depends on your storage solution
    // This is a placeholder
    return `https://storage.example.com/${file.filename}`
  }

  /**
   * Helper: Get media metadata
   */
  private static async getMediaMetadata(file: any, mediaType: string): Promise<MediaMetadata> {
    return {
      size: file.size,
      format: file.mimetype
    }
  }
}
