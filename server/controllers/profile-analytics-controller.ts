// server/controllers/profile-analytics-controller.ts
// CORRECTED - Import and use ProfileAnalyticsModel

import type { H3Event } from 'h3'
import { ProfileAnalyticsModel } from '../models/profile-analytics'
import { ProfileViewModel } from '../models/profile-view'
import { RankModel } from '../models/rank'

export class ProfileAnalyticsController {
  /**
   * Get profile analytics
   */
  static async getAnalytics(event: H3Event, userId: string) {
    try {
      // ✅ USE ProfileAnalyticsModel
      const analytics = await ProfileAnalyticsModel.getByUserId(userId)

      if (!analytics) {
        return {
          success: false,
          error: 'Analytics not found'
        }
      }

      return {
        success: true,
        data: analytics,
        message: 'Analytics retrieved'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] Get analytics error:', error)
      throw error
    }
  }

  /**
   * Get profile views
   */
  static async getProfileViews(event: H3Event, userId: string) {
    try {
      // ✅ USE ProfileViewModel
      const { views, total } = await ProfileViewModel.getProfileViews(userId)

      return {
        success: true,
        data: { views, total },
        message: 'Profile views retrieved'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] Get profile views error:', error)
      throw error
    }
  }

  /**
   * Record profile view
   */
  static async recordView(event: H3Event, profileId: string) {
    try {
      const viewerId = event.context.user?.id

      if (!viewerId || viewerId === profileId) {
        return { success: false, error: 'Invalid view' }
      }

      // ✅ USE ProfileViewModel
      await ProfileViewModel.create({
        profileId,
        viewerId
      })

      // ✅ USE ProfileAnalyticsModel
      await ProfileAnalyticsModel.incrementViews(profileId)

      return {
        success: true,
        message: 'View recorded'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] Record view error:', error)
      throw error
    }
  }

  /**
   * Get engagement metrics
   */
  static async getEngagementMetrics(event: H3Event, userId: string) {
    try {
      // ✅ USE ProfileAnalyticsModel
      const analytics = await ProfileAnalyticsModel.getByUserId(userId)

      if (!analytics) {
        return { success: false, error: 'Analytics not found' }
      }

      // ✅ USE RankModel
      const rank = await RankModel.getByUserId(userId)

      return {
        success: true,
        data: {
          analytics,
          rank,
          engagementRate: analytics.engagement_rate,
          totalFollowers: analytics.total_followers,
          totalPosts: analytics.total_posts,
          totalLikesReceived: analytics.total_likes_received
        },
        message: 'Engagement metrics retrieved'
      }
    } catch (error) {
      console.error('[ProfileAnalyticsController] Get engagement metrics error:', error)
      throw error
    }
  }
}

export default ProfileAnalyticsController
