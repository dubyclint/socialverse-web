// FILE: /server/models/engagement.ts
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
export type EngagementType = 'view' | 'like' | 'comment' | 'share' | 'follow' | 'click'

export interface Engagement {
  id: string
  userId: string
  targetId: string
  targetType: string
  engagementType: EngagementType
  metadata?: Record<string, any>
  createdAt: string
}

export interface EngagementStats {
  targetId: string
  targetType: string
  views: number
  likes: number
  comments: number
  shares: number
  follows: number
  clicks: number
  totalEngagements: number
  engagementRate: number
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class EngagementModel {
  static async recordEngagement(
    userId: string,
    targetId: string,
    targetType: string,
    engagementType: EngagementType,
    metadata?: Record<string, any>
  ): Promise<Engagement> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('engagements')
        .insert({
          userId,
          targetId,
          targetType,
          engagementType,
          metadata,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Engagement
    } catch (error) {
      console.error('[EngagementModel] Error recording engagement:', error)
      throw error
    }
  }

  static async getEngagementStats(targetId: string, targetType: string): Promise<EngagementStats | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('engagement_stats')
        .select('*')
        .eq('targetId', targetId)
        .eq('targetType', targetType)
        .single()

      if (error) {
        console.warn('[EngagementModel] Stats not found')
        return null
      }

      return data as EngagementStats
    } catch (error) {
      console.error('[EngagementModel] Error fetching stats:', error)
      throw error
    }
  }

  static async getUserEngagements(userId: string, limit = 50, offset = 0): Promise<Engagement[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('engagements')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as Engagement[]
    } catch (error) {
      console.error('[EngagementModel] Error fetching engagements:', error)
      throw error
    }
  }

  static async getTargetEngagements(targetId: string, targetType: string, limit = 50): Promise<Engagement[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('engagements')
        .select('*')
        .eq('targetId', targetId)
        .eq('targetType', targetType)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Engagement[]
    } catch (error) {
      console.error('[EngagementModel] Error fetching target engagements:', error)
      throw error
    }
  }

  static async hasEngaged(userId: string, targetId: string, engagementType: EngagementType): Promise<boolean> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('engagements')
        .select('id')
        .eq('userId', userId)
        .eq('targetId', targetId)
        .eq('engagementType', engagementType)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      console.error('[EngagementModel] Error checking engagement:', error)
      throw error
    }
  }
}
