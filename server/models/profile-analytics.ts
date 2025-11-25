// server/models/profile-analytics.ts
// Profile Analytics Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ProfileAnalytics {
  id: string
  user_id: string
  total_views: number
  total_followers: number
  total_following: number
  total_posts: number
  total_likes_received: number
  engagement_rate: number
  created_at: string
  updated_at: string
}

export class ProfileAnalyticsModel {
  static async getByUserId(userId: string): Promise<ProfileAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('profile_analytics')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as ProfileAnalytics) || null
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Get by user ID error:', error)
      throw error
    }
  }

  static async create(userId: string): Promise<ProfileAnalytics> {
    try {
      const { data, error } = await supabase
        .from('profile_analytics')
        .insert({
          user_id: userId,
          total_views: 0,
          total_followers: 0,
          total_following: 0,
          total_posts: 0,
          total_likes_received: 0,
          engagement_rate: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ProfileAnalytics
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Create error:', error)
      throw error
    }
  }

  static async incrementViews(userId: string): Promise<void> {
    try {
      const analytics = await this.getByUserId(userId)
      if (!analytics) {
        await this.create(userId)
        return
      }

      await supabase
        .from('profile_analytics')
        .update({
          total_views: analytics.total_views + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Increment views error:', error)
      throw error
    }
  }

  static async updateEngagementRate(userId: string): Promise<void> {
    try {
      const analytics = await this.getByUserId(userId)
      if (!analytics) return

      const engagementRate = analytics.total_posts > 0
        ? (analytics.total_likes_received / (analytics.total_posts * 100)) * 100
        : 0

      await supabase
        .from('profile_analytics')
        .update({
          engagement_rate: engagementRate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Update engagement rate error:', error)
      throw error
    }
  }
}

export default ProfileAnalyticsModel
