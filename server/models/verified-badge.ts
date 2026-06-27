// FILE: /server/models/verified-badge.ts
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
export type BadgeType = 'VERIFIED' | 'CREATOR' | 'INFLUENCER' | 'PARTNER' | 'OFFICIAL'

export interface VerifiedBadge {
  id: string
  userId: string
  badgeType: BadgeType
  isActive: boolean
  reason?: string
  awardedAt: string
  expiresAt?: string
  awardedBy: string
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class VerifiedBadgeModel {
  static async awardBadge(
    userId: string,
    badgeType: BadgeType,
    awardedBy: string,
    reason?: string,
    expiresAt?: string
  ): Promise<VerifiedBadge> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('verified_badges')
        .insert({
          userId,
          badgeType,
          isActive: true,
          reason,
          awardedAt: new Date().toISOString(),
          expiresAt,
          awardedBy,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as VerifiedBadge
    } catch (error) {
      console.error('[VerifiedBadgeModel] Error awarding badge:', error)
      throw error
    }
  }

  static async getUserBadges(userId: string): Promise<VerifiedBadge[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('verified_badges')
        .select('*')
        .eq('userId', userId)
        .eq('isActive', true)
        .or(`expiresAt.is.null,expiresAt.gt.${now}`)

      if (error) throw error
      return (data || []) as VerifiedBadge[]
    } catch (error) {
      console.error('[VerifiedBadgeModel] Error fetching user badges:', error)
      throw error
    }
  }

  static async hasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('verified_badges')
        .select('id')
        .eq('userId', userId)
        .eq('badgeType', badgeType)
        .eq('isActive', true)
        .or(`expiresAt.is.null,expiresAt.gt.${now}`)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      console.error('[VerifiedBadgeModel] Error checking badge:', error)
      return false
    }
  }

  static async revokeBadge(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('verified_badges')
        .update({ isActive: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[VerifiedBadgeModel] Error revoking badge:', error)
      throw error
    }
  }

  static async getBadgesByType(badgeType: BadgeType, limit = 100): Promise<VerifiedBadge[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('verified_badges')
        .select('*')
        .eq('badgeType', badgeType)
        .eq('isActive', true)
        .or(`expiresAt.is.null,expiresAt.gt.${now}`)
        .limit(limit)

      if (error) throw error
      return (data || []) as VerifiedBadge[]
    } catch (error) {
      console.error('[VerifiedBadgeModel] Error fetching badges by type:', error)
      throw error
    }
  }
}
