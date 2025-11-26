// FILE: /server/models/profile-view.ts
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
export interface ProfileView {
  id: string
  viewedProfileId: string
  viewerUserId: string
  viewedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ProfileViewModel {
  static async recordView(viewedProfileId: string, viewerUserId: string): Promise<ProfileView> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_views')
        .insert({
          viewedProfileId,
          viewerUserId,
          viewedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ProfileView
    } catch (error) {
      console.error('[ProfileViewModel] Error recording view:', error)
      throw error
    }
  }

  static async getProfileViewCount(profileId: string, days = 30): Promise<number> {
    try {
      const supabase = await getSupabase()
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewedProfileId', profileId)
        .gte('viewedAt', startDate)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[ProfileViewModel] Error fetching view count:', error)
      throw error
    }
  }

  static async getRecentViewers(profileId: string, limit = 20): Promise<ProfileView[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewedProfileId', profileId)
        .order('viewedAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as ProfileView[]
    } catch (error) {
      console.error('[ProfileViewModel] Error fetching recent viewers:', error)
      throw error
    }
  }

  static async getViewHistory(viewerUserId: string, limit = 50, offset = 0): Promise<ProfileView[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_views')
        .select('*')
        .eq('viewerUserId', viewerUserId)
        .order('viewedAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as ProfileView[]
    } catch (error) {
      console.error('[ProfileViewModel] Error fetching view history:', error)
      throw error
    }
  }
}
