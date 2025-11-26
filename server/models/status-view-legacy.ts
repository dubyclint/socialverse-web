// FILE: /server/models/status-view-legacy.ts
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
export interface StatusViewLegacy {
  id: string
  userId: string
  statusId: string
  viewedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class StatusViewLegacyModel {
  static async recordView(userId: string, statusId: string): Promise<StatusViewLegacy> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('status_views_legacy')
        .insert({
          userId,
          statusId,
          viewedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as StatusViewLegacy
    } catch (error) {
      console.error('[StatusViewLegacyModel] Error recording view:', error)
      throw error
    }
  }

  static async getStatusViewCount(statusId: string): Promise<number> {
    try {
      const supabase = await getSupabase()
      const { count, error } = await supabase
        .from('status_views_legacy')
        .select('*', { count: 'exact', head: true })
        .eq('statusId', statusId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[StatusViewLegacyModel] Error fetching view count:', error)
      throw error
    }
  }

  static async getUserStatusViews(userId: string, limit = 50): Promise<StatusViewLegacy[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('status_views_legacy')
        .select('*')
        .eq('userId', userId)
        .order('viewedAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as StatusViewLegacy[]
    } catch (error) {
      console.error('[StatusViewLegacyModel] Error fetching user views:', error)
      throw error
    }
  }
}
