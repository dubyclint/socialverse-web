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

export interface Presence {
  user_id: string
  status: 'online' | 'offline' | 'away' | 'busy'
  last_seen: string | null
  updated_at: string
}

// ============================================================================
// STATUS MODEL CLASS
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

// ============================================================================
// PRESENCE MODEL CLASS
// ============================================================================
export class PresenceModel {
  static async getPresence(userId: string): Promise<Presence | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.warn('[PresenceModel] Presence not found')
        return null
      }

      return data as Presence
    } catch (error) {
      console.error('[PresenceModel] Error fetching presence:', error)
      throw error
    }
  }

  static async updatePresence(
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy'
  ): Promise<Presence> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status,
          last_seen: status === 'offline' ? now : null,
          updated_at: now
        })
        .select()
        .single()

      if (error) throw error
      return data as Presence
    } catch (error) {
      console.error('[PresenceModel] Error updating presence:', error)
      throw error
    }
  }

  static async setOffline(userId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status: 'offline',
          last_seen: now,
          updated_at: now
        })

      if (error) throw error
    } catch (error) {
      console.error('[PresenceModel] Error setting offline:', error)
      throw error
    }
  }

  static async getOnlineUsers(): Promise<Presence[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('status', 'online')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return (data || []) as Presence[]
    } catch (error) {
      console.error('[PresenceModel] Error fetching online users:', error)
      throw error
    }
  }
}
