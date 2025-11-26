// FILE: /server/models/profile-analytics.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface ProfileAnalytics {
  id: string
  userId: string
  date: string
  profileViews: number
  followers: number
  following: number
  postsCount: number
  engagementRate: number
  avgLikesPerPost: number
  avgCommentsPerPost: number
  avgSharesPerPost: number
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ProfileAnalyticsModel {
  static async recordDailyAnalytics(userId: string, analytics: Omit<ProfileAnalytics, 'id' | 'createdAt'>): Promise<ProfileAnalytics> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_analytics')
        .insert({
          ...analytics,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ProfileAnalytics
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Error recording analytics:', error)
      throw error
    }
  }

  static async getAnalytics(userId: string, startDate: string, endDate: string): Promise<ProfileAnalytics[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_analytics')
        .select('*')
        .eq('userId', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error
      return (data || []) as ProfileAnalytics[]
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Error fetching analytics:', error)
      throw error
    }
  }

  static async getLatestAnalytics(userId: string): Promise<ProfileAnalytics | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_analytics')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.warn('[ProfileAnalyticsModel] No analytics found')
        return null
      }

      return data as ProfileAnalytics
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Error fetching latest analytics:', error)
      throw error
    }
  }

  static async getGrowthMetrics(userId: string, days = 30): Promise<any> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase.rpc('get_profile_growth_metrics', {
        user_id: userId,
        days_back: days
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ProfileAnalyticsModel] Error fetching growth metrics:', error)
      throw error
    }
  }
}
