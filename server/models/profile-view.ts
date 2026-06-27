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

export interface ProfileView {
  id: string
  profile_id: string
  viewer_id: string
  viewed_at: string

  // optional compatibility aliases
  viewedProfileId?: string
  viewerUserId?: string
  viewedAt?: string
}

const withAliases = (row: any): ProfileView => ({
  ...row,
  viewedProfileId: row.profile_id,
  viewerUserId: row.viewer_id,
  viewedAt: row.viewed_at
})

export class ProfileViewModel {
  /**
   * Canonical create method used by controller:
   * ProfileViewModel.create({ profileId, viewerId })
   */
  static async create(input: { profileId: string; viewerId: string }): Promise<ProfileView | null> {
    const supabase = getSupabase()

    const profileId = String(input.profileId || '').trim()
    const viewerId = String(input.viewerId || '').trim()
    if (!profileId || !viewerId) throw new Error('profileId and viewerId are required')
    if (profileId === viewerId) return null

    // Idempotent-friendly insert:
    // if you have a unique index on (profile_id, viewer_id, viewed_at::date) or similar,
    // duplicates may error; we treat that as non-fatal for analytics.
    const { data, error } = await supabase
      .from('profile_views')
      .insert({
        profile_id: profileId,
        viewer_id: viewerId,
        viewed_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) {
      // Duplicate conflict: return null instead of crashing analytics flow
      if (String(error.code) === '23505') return null
      console.error('[ProfileViewModel.create] error:', error.message)
      throw new Error('Failed to record profile view')
    }

    return data ? withAliases(data) : null
  }

  // Backward-compatible alias (if other callers still use recordView)
  static async recordView(viewedProfileId: string, viewerUserId: string): Promise<ProfileView | null> {
    return this.create({ profileId: viewedProfileId, viewerId: viewerUserId })
  }

  /**
   * Used by analytics controller:
   * const { views, total } = await ProfileViewModel.getProfileViews(userId)
   */
  static async getProfileViews(profileId: string, limit = 50, offset = 0): Promise<{ views: ProfileView[]; total: number }> {
    const supabase = getSupabase()

    const [{ data, error }, { count, error: countError }] = await Promise.all([
      supabase
        .from('profile_views')
        .select('*')
        .eq('profile_id', profileId)
        .order('viewed_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)
    ])

    if (error) {
      console.error('[ProfileViewModel.getProfileViews] list error:', error.message)
      throw new Error('Failed to fetch profile views')
    }
    if (countError) {
      console.error('[ProfileViewModel.getProfileViews] count error:', countError.message)
      throw new Error('Failed to count profile views')
    }

    return {
      views: (data || []).map(withAliases),
      total: count || 0
    }
  }

  static async getProfileViewCount(profileId: string, days = 30): Promise<number> {
    const supabase = getSupabase()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { count, error } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('viewed_at', startDate)

    if (error) {
      console.error('[ProfileViewModel.getProfileViewCount] error:', error.message)
      throw new Error('Failed to fetch view count')
    }

    return count || 0
  }

  static async getRecentViewers(profileId: string, limit = 20): Promise<ProfileView[]> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('profile_views')
      .select('*')
      .eq('profile_id', profileId)
      .order('viewed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[ProfileViewModel.getRecentViewers] error:', error.message)
      throw new Error('Failed to fetch recent viewers')
    }

    return (data || []).map(withAliases)
  }

  static async getViewHistory(viewerUserId: string, limit = 50, offset = 0): Promise<ProfileView[]> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('profile_views')
      .select('*')
      .eq('viewer_id', viewerUserId)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[ProfileViewModel.getViewHistory] error:', error.message)
      throw new Error('Failed to fetch view history')
    }

    return (data || []).map(withAliases)
  }
}
