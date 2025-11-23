// server/controllers/profile-analytics-controller.ts - Profile Analytics Management
// ============================================================================

import { H3Event, readBody, getHeader, getClientIP, getQuery } from 'h3'
import { ProfileView } from '../models/profile-view'
import { PremiumModel } from '../models/premium'

export interface ProfileViewData {
  profileId: string
  viewType: 'direct' | 'search' | 'recommendation' | 'profile_link'
  viewSource?: string
  metadata?: Record<string, any>
}

export interface AnalyticsResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export class ProfileAnalyticsController {
  /**
   * Record a profile view
   * POST /api/profile-analytics/view
   */
  static async recordView(event: H3Event): Promise<AnalyticsResponse> {
    try {
      const body = await readBody(event)
      const { profileId, viewType = 'direct', viewSource, metadata } = body
      const viewerId = event.context.user?.id
      const viewerIP = getHeader(event, 'x-forwarded-for') || getClientIP(event)
      const userAgent = getHeader(event, 'user-agent')

      if (!profileId) {
        return {
          success: false,
          error: 'Profile ID is required'
        }
      }

      // Don't record self-views
      if (viewerId === profileId) {
        return {
          success: true,
          message: 'Self-view not recorded'
        }
      }

      const viewData = {
        profileId,
        viewerId: viewerId || null,
        viewType,
        viewSource,
        viewerIP,
        userAgent,
        metadata,
        viewedAt: new Date().toISOString()
      }

      const savedView = await ProfileView.recordView(viewData)

      return {
        success: true,
        data: savedView,
        message: 'Profile view recorded'
      }
    } catch (error) {
      console.error('Error recording profile view:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record view'
      }
    }
  }

  /**
   * Get profile analytics
   * GET /api/profile-analytics/:profileId
   */
  static async getProfileAnalytics(event: H3Event): Promise<AnalyticsResponse> {
    try {
      const profileId = event.context.params?.profileId
      const userId = event.context.user?.id
      const days = parseInt(getQuery(event).days as string) || 30

      if (!profileId) {
        return {
          success: false,
          error: 'Profile ID is required'
        }
      }

      // Verify user owns the profile or has premium access
      if (userId !== profileId) {
        const hasPremium = await PremiumModel.getSubscriptionByUserId(userId)
        if (!hasPremium || hasPremium.status !== 'ACTIVE') {
          return {
            success: false,
            error: 'Premium subscription required to view analytics'
          }
        }
      }

      const analytics = await ProfileView.getProfileAnalytics(profileId, days)

      return {
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully'
      }
    } catch (error) {
      console.error('Error fetching profile analytics:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics'
      }
    }
  }

  /**
   * Get profile view history
   * GET /api/profile-analytics/:profileId/views
   */
  static async getViewHistory(event: H3Event): Promise<AnalyticsResponse> {
    try {
      const profileId = event.context.params?.profileId
      const userId = event.context.user?.id
      const limit = parseInt(getQuery(event).limit as string) || 50
      const offset = parseInt(getQuery(event).offset as string) || 0

      if (!profileId) {
        return {
          success: false,
          error: 'Profile ID is required'
        }
      }

      // Verify ownership
      if (userId !== profileId) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      const views = await ProfileView.getViewHistory(profileId, limit, offset)

      return {
        success: true,
        data: views,
        message: 'View history retrieved'
      }
    } catch (error) {
      console.error('Error fetching view history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch view history'
      }
    }
  }

  /**
   * Get top profile viewers
   * GET /api/profile-analytics/:profileId/top-viewers
   */
  static async getTopViewers(event: H3Event): Promise<AnalyticsResponse> {
    try {
      const profileId = event.context.params?.profileId
      const userId = event.context.user?.id
      const limit = parseInt(getQuery(event).limit as string) || 10

      if (!profileId) {
        return {
          success: false,
          error: 'Profile ID is required'
        }
      }

      // Verify ownership
      if (userId !== profileId) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      const topViewers = await ProfileView.getTopViewers(profileId, limit)

      return {
        success: true,
        data: topViewers,
        message: 'Top viewers retrieved'
      }
    } catch (error) {
      console.error('Error fetching top viewers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top viewers'
      }
    }
  }

  /**
   * Get view statistics by type
   * GET /api/profile-analytics/:profileId/stats
   */
  static async getViewStats(event: H3Event): Promise<AnalyticsResponse> {
    try {
      const profileId = event.context.params?.profileId
      const userId = event.context.user?.id
      const days = parseInt(getQuery(event).days as string) || 30

      if (!profileId) {
        return {
          success: false,
          error: 'Profile ID is required'
        }
      }

      // Verify ownership
      if (userId !== profileId) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      const stats = await ProfileView.getViewStatsByType(profileId, days)

      return {
        success: true,
        data: stats,
        message: 'Statistics retrieved'
      }
    } catch (error) {
      console.error('Error fetching view stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      }
    }
  }

  /**
   * Clear view history
   * DELETE /api/profile-analytics/:profileId/views
   */
  static async clearViewHistory(event: H3Event): Promise<AnalyticsResponse> {
    try {
      const profileId = event.context.params?.profileId
      const userId = event.context.user?.id

      if (!profileId) {
        return {
          success: false,
          error: 'Profile ID is required'
        }
      }

      // Verify ownership
      if (userId !== profileId) {
        return {
          success: false,
          error: 'Access denied'
        }
      }

      await ProfileView.clearViewHistory(profileId)

      return {
        success: true,
        message: 'View history cleared'
      }
    } catch (error) {
      console.error('Error clearing view history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear history'
      }
    }
  }
}
