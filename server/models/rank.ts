// FILE: /server/models/rank.ts
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
export type RankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

export interface Rank {
  id: string
  userId: string
  tier: RankTier
  points: number
  level: number
  totalPoints: number
  badges: string[]
  achievements: string[]
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class RankModel {
  static async getUserRank(userId: string): Promise<Rank | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.warn('[RankModel] Rank not found')
        return null
      }

      return data as Rank
    } catch (error) {
      console.error('[RankModel] Error fetching rank:', error)
      throw error
    }
  }

  static async createRank(userId: string): Promise<Rank> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ranks')
        .insert({
          userId,
          tier: 'BRONZE',
          points: 0,
          level: 1,
          totalPoints: 0,
          badges: [],
          achievements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Rank
    } catch (error) {
      console.error('[RankModel] Error creating rank:', error)
      throw error
    }
  }

  static async addPoints(userId: string, points: number): Promise<Rank> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase.rpc('add_rank_points', {
        user_id: userId,
        points_to_add: points
      })

      if (error) throw error
      return data as Rank
    } catch (error) {
      console.error('[RankModel] Error adding points:', error)
      throw error
    }
  }

  static async getLeaderboard(limit = 100): Promise<Rank[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('totalPoints', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Rank[]
    } catch (error) {
      console.error('[RankModel] Error fetching leaderboard:', error)
      throw error
    }
  }

  static async getTierLeaderboard(tier: RankTier, limit = 50): Promise<Rank[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('tier', tier)
        .order('points', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Rank[]
    } catch (error) {
      console.error('[RankModel] Error fetching tier leaderboard:', error)
      throw error
    }
  }

  static async awardBadge(userId: string, badge: string): Promise<Rank> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase.rpc('award_badge', {
        user_id: userId,
        badge_name: badge
      })

      if (error) throw error
      return data as Rank
    } catch (error) {
      console.error('[RankModel] Error awarding badge:', error)
      throw error
    }
  }
}
