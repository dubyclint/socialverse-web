import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

export interface ProfileAnalytics {
  id: string
  user_id: string
  date: string

  profile_views: number
  total_followers: number
  total_following: number
  total_posts: number
  engagement_rate: number
  avg_likes_per_post: number
  avg_comments_per_post: number
  avg_shares_per_post: number
  total_likes_received?: number

  created_at: string
  updated_at?: string

  // compatibility aliases
  userId?: string
  profileViews?: number
  followers?: number
  following?: number
  postsCount?: number
  engagementRate?: number
  avgLikesPerPost?: number
  avgCommentsPerPost?: number
  avgSharesPerPost?: number
  createdAt?: string
}

const withAliases = (row: any): ProfileAnalytics => ({
  ...row,
  userId: row.user_id,
  profileViews: row.profile_views,
  followers: row.total_followers,
  following: row.total_following,
  postsCount: row.total_posts,
  engagementRate: row.engagement_rate,
  avgLikesPerPost: row.avg_likes_per_post,
  avgCommentsPerPost: row.avg_comments_per_post,
  avgSharesPerPost: row.avg_shares_per_post,
  createdAt: row.created_at
})

export class ProfileAnalyticsModel {
  static async recordDailyAnalytics(
    userId: string,
    analytics: Partial<ProfileAnalytics>
  ): Promise<ProfileAnalytics> {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    const payload = {
      user_id: userId,
      date: analytics.date || now.slice(0, 10),
      profile_views: analytics.profile_views ?? analytics.profileViews ?? 0,
      total_followers: analytics.total_followers ?? analytics.followers ?? 0,
      total_following: analytics.total_following ?? analytics.following ?? 0,
      total_posts: analytics.total_posts ?? analytics.postsCount ?? 0,
      engagement_rate: analytics.engagement_rate ?? analytics.engagementRate ?? 0,
      avg_likes_per_post: analytics.avg_likes_per_post ?? analytics.avgLikesPerPost ?? 0,
      avg_comments_per_post: analytics.avg_comments_per_post ?? analytics.avgCommentsPerPost ?? 0,
      avg_shares_per_post: analytics.avg_shares_per_post ?? analytics.avgSharesPerPost ?? 0,
      total_likes_received: analytics.total_likes_received ?? 0,
      created_at: now,
      updated_at: now
    }

    const { data, error } = await supabase
      .from('profile_analytics')
      .insert(payload)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[ProfileAnalyticsModel.recordDailyAnalytics] error:', error?.message)
      throw new Error(error?.message || 'Failed to record analytics')
    }

    return withAliases(data)
  }

  static async getAnalytics(userId: string, startDate: string, endDate: string): Promise<ProfileAnalytics[]> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('profile_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('[ProfileAnalyticsModel.getAnalytics] error:', error.message)
      throw new Error('Failed to fetch analytics')
    }

    return (data || []).map(withAliases)
  }

  static async getLatestAnalytics(userId: string): Promise<ProfileAnalytics | null> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('profile_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[ProfileAnalyticsModel.getLatestAnalytics] error:', error.message)
      throw new Error('Failed to fetch latest analytics')
    }

    return data ? withAliases(data) : null
  }

  // Used by profile-analytics-controller.ts
  static async getByUserId(userId: string): Promise<ProfileAnalytics | null> {
    return this.getLatestAnalytics(userId)
  }

  // Used by profile-analytics-controller.ts (best effort view bump)
  static async incrementViews(userId: string): Promise<void> {
    const supabase = getSupabase()
    const today = new Date().toISOString().slice(0, 10)

    // Try update existing today row
    const { data: row, error: findError } = await supabase
      .from('profile_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (findError) {
      console.error('[ProfileAnalyticsModel.incrementViews] lookup error:', findError.message)
      throw new Error('Failed to increment profile views')
    }

    if (row) {
      const nextViews = Number(row.profile_views || 0) + 1
      const { error: updateError } = await supabase
        .from('profile_analytics')
        .update({
          profile_views: nextViews,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id)

      if (updateError) {
        console.error('[ProfileAnalyticsModel.incrementViews] update error:', updateError.message)
        throw new Error('Failed to increment profile views')
      }
      return
    }

    // Create baseline today row
    const now = new Date().toISOString()
    const { error: insertError } = await supabase
      .from('profile_analytics')
      .insert({
        user_id: userId,
        date: today,
        profile_views: 1,
        total_followers: 0,
        total_following: 0,
        total_posts: 0,
        engagement_rate: 0,
        avg_likes_per_post: 0,
        avg_comments_per_post: 0,
        avg_shares_per_post: 0,
        total_likes_received: 0,
        created_at: now,
        updated_at: now
      })

    if (insertError) {
      console.error('[ProfileAnalyticsModel.incrementViews] insert error:', insertError.message)
      throw new Error('Failed to initialize profile analytics row')
    }
  }

  static async getGrowthMetrics(userId: string, days = 30): Promise<any> {
    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('get_profile_growth_metrics', {
      user_id: userId,
      days_back: days
    })

    if (error) {
      console.error('[ProfileAnalyticsModel.getGrowthMetrics] error:', error.message)
      throw new Error('Failed to fetch growth metrics')
    }

    return data
  }
}
