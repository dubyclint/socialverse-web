// FILE: /server/models/status.ts
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
export interface Status {
  id: string
  userId: string
  content: string
  mediaUrl?: string
  backgroundColor?: string
  textColor?: string
  expiresAt: string
  viewCount: number
  createdAt: string
  deletedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class StatusModel {
  static async createStatus(
    userId: string,
    content: string,
    expiresAt: string,
    mediaUrl?: string,
    backgroundColor?: string,
    textColor?: string
  ): Promise<Status> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('statuses')
        .insert({
          userId,
          content,
          mediaUrl,
          backgroundColor,
          textColor,
          expiresAt,
          viewCount: 0,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Status
    } catch (error) {
      console.error('[StatusModel] Error creating status:', error)
      throw error
    }
  }

  static async getStatus(id: string): Promise<Status | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('id', id)
        .is('deletedAt', null)
        .single()

      if (error) {
        console.warn('[StatusModel] Status not found')
        return null
      }

      return data as Status
    } catch (error) {
      console.error('[StatusModel] Error fetching status:', error)
      throw error
    }
  }

  static async getUserStatuses(userId: string): Promise<Status[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('userId', userId)
        .gt('expiresAt', now)
        .is('deletedAt', null)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as Status[]
    } catch (error) {
      console.error('[StatusModel] Error fetching user statuses:', error)
      throw error
    }
  }

  static async deleteStatus(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('statuses')
        .update({ deletedAt: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[StatusModel] Error deleting status:', error)
      throw error
    }
  }

  static async incrementViewCount(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.rpc('increment_status_views', {
        status_id: id
      })

      if (error) throw error
    } catch (error) {
      console.error('[StatusModel] Error incrementing view count:', error)
      throw error
    }
  }
}
