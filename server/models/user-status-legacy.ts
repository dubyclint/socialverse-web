// FILE: /server/models/user-status-legacy.ts
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
export type UserStatusType = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND'

export interface UserStatusLegacy {
  id: string
  userId: string
  status: UserStatusType
  statusMessage?: string
  lastSeen: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UserStatusLegacyModel {
  static async getStatus(userId: string): Promise<UserStatusLegacy | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_status_legacy')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.warn('[UserStatusLegacyModel] Status not found')
        return null
      }

      return data as UserStatusLegacy
    } catch (error) {
      console.error('[UserStatusLegacyModel] Error fetching status:', error)
      throw error
    }
  }

  static async setStatus(userId: string, status: UserStatusType, statusMessage?: string): Promise<UserStatusLegacy> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_status_legacy')
        .upsert({
          userId,
          status,
          statusMessage,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserStatusLegacy
    } catch (error) {
      console.error('[UserStatusLegacyModel] Error setting status:', error)
      throw error
    }
  }

  static async getOnlineUsers(): Promise<UserStatusLegacy[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_status_legacy')
        .select('*')
        .eq('status', 'ONLINE')

      if (error) throw error
      return (data || []) as UserStatusLegacy[]
    } catch (error) {
      console.error('[UserStatusLegacyModel] Error fetching online users:', error)
      throw error
    }
  }

  static async updateLastSeen(userId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('user_status_legacy')
        .update({ lastSeen: new Date().toISOString() })
        .eq('userId', userId)

      if (error) throw error
    } catch (error) {
      console.error('[UserStatusLegacyModel] Error updating last seen:', error)
      throw error
    }
  }
}
