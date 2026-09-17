// FILE: /server/models/status.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null
import { getAdminClient } from '~/server/utils/supabase-server'

async function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = await getAdminClient()
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

// Input type used by some API handlers (legacy snake_case allowed)
export type CreateStatusInput = {
  content: string
  media_type?: string
  media_url?: string
  background_color?: string
  text_color?: string
  expires_at?: string
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

  // Get the currently active status for a user (most recent, not expired)
  static async getActiveStatus(userId: string): Promise<Status | null> {
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
        .limit(1)
        .single()

      if (error || !data) return null
      return data as Status
    } catch (err) {
      console.error('[StatusModel] getActiveStatus error:', err)
      return null
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

  // --- Compatibility adapters (legacy names used by controllers) ---
  // These thin adapters keep existing controllers working while we
  // incrementally migrate model/controller APIs to stricter typings.

  static async create(data: any): Promise<Status> {
    // Accept either camelCase or snake_case fields
    const userId = data.userId || data.user_id || data.user
    return StatusModel.createStatus(
      userId,
      data.content,
      data.expiresAt || data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      data.mediaUrl || data.media_url,
      data.backgroundColor || data.background_color,
      data.textColor || data.text_color
    )
  }

  static async getFriendStatuses(userId: string): Promise<Status[]> {
    try {
      const supabase = await getSupabase()
      const { data: pals, error: palsError } = await supabase
        .from('pals')
        .select('pal_id')
        .eq('user_id', userId)
        .eq('status', 'accepted')

      if (palsError) throw palsError

      const ids = (pals || []).map((p: any) => p.pal_id)
      if (!ids || ids.length === 0) return []

      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .in('userId', ids)
        .gt('expiresAt', now)
        .is('deletedAt', null)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as Status[]
    } catch (err) {
      console.error('[StatusModel] getFriendStatuses adapter error:', err)
      return []
    }
  }

  static async recordView(statusId: string, _viewerId?: string): Promise<Status | null> {
    try {
      await StatusModel.incrementViewCount(statusId)
      return await StatusModel.getStatus(statusId)
    } catch (err) {
      console.error('[StatusModel] recordView adapter error:', err)
      return null
    }
  }

  // Alias used by older codepaths
  static async recordStatusView(statusId: string, _viewerId?: string): Promise<void> {
    await StatusModel.incrementViewCount(statusId)
  }

  // Backwards-compatible helper used by older controllers
  static async getStatusViewCount(statusId: string): Promise<number> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('statuses')
        .select('viewCount')
        .eq('id', statusId)
        .single()

      if (error || !data) return 0
      return data.viewCount || 0
    } catch (err) {
      console.error('[StatusModel] getStatusViewCount error:', err)
      return 0
    }
  }

  // legacy alias: controllers call `StatusModel.delete(id, userId)` in some places
  static async delete(id: string, _userId?: string): Promise<void> {
    return StatusModel.deleteStatus(id)
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
