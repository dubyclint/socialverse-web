import type { H3Event } from 'h3'
import { ProfileAnalyticsModel } from '../models/profile-analytics'
import { ProfileViewModel } from '../models/profile-view'
import { RankModel } from '../models/rank'

type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string }

export class ProfileAnalyticsController {
  /**
   * Get profile analytics
   */
  static async getAnalytics(_event: H3Event, userId: string): Promise<ApiResponse<any>> {
    try {
      const analytics = await ProfileAnalyticsModel.getByUserId(userId)

      if (!analytics) {
        return { success: false, error: 'Analytics not found' }
      }

      return {
        success: true,
        data: analytics,
        message: 'Analytics retrieved'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] getAnalytics error:', error)
      return { success: false, error: 'Failed to retrieve analytics' }
    }
  }

  /**
   * Get profile views
   */
  static async getProfileViews(_event: H3Event, userId: string): Promise<ApiResponse<{ views: any[]; total: number }>> {
    try {
      const { views, total } = await ProfileViewModel.getProfileViews(userId)

      return {
        success: true,
        data: { views, total },
        message: 'Profile views retrieved'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] getProfileViews error:', error)
      return { success: false, error: 'Failed to retrieve profile views' }
    }
  }

  /**
   * Record profile view (best-effort, idempotent friendly)
   */
  static async recordView(event: H3Event, profileId: string): Promise<ApiResponse<null>> {
    try {
      const viewerId = event.context.user?.id

      if (!viewerId || !profileId || viewerId === profileId) {
        return { success: false, error: 'Invalid view' }
      }

      // Insert view record (ignore duplicate collisions in model if supported)
      await ProfileViewModel.create({ profileId, viewerId })

      // Best effort increment — should not break caller if counter update fails
      try {
        await ProfileAnalyticsModel.incrementViews(profileId)
      } catch (incErr) {
        console.warn('[ProfileAnalyticsController] incrementViews warning:', incErr)
      }

      return {
        success: true,
        data: null,
        message: 'View recorded'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] recordView error:', error)
      return { success: false, error: 'Failed to record view' }
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(_event: H3Event, userId: string): Promise<ApiResponse<any>> {
    try {
      const analytics = await ProfileAnalyticsModel.getByUserId(userId)
      if (!analytics) return { success: false, error: 'Analytics not found' }

      const rank = await RankModel.getByUserId(userId)

      return {
        success: true,
        data: {
          analytics,
          rank,
          engagementRate: analytics.engagement_rate ?? 0,
          totalFollowers: analytics.total_followers ?? 0,
          totalPosts: analytics.total_posts ?? 0,
          totalLikesReceived: analytics.total_likes_received ?? 0
        },
        message: 'Engagement metrics retrieved'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] getEngagementMetrics error:', error)
      return { success: false, error: 'Failed to retrieve engagement metrics' }
    }
  }
}

export default ProfileAnalyticsController
