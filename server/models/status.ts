// FILE: /server/models/status.ts
// Status Model - Complete Implementation with Supabase

import { db } from '~/server/utils/database'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserStatus {
  id: string
  user_id: string
  content: string
  media_type: 'text' | 'image' | 'video' | 'audio'
  media_url?: string
  background_color: string
  text_color: string
  is_active: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

export interface StatusView {
  id: string
  status_id: string
  viewed_by_user_id: string
  viewed_at: string
}

export interface UserPresence {
  user_id: string
  status: 'online' | 'offline' | 'away' | 'busy'
  last_seen: string
  updated_at: string
}

export interface CreateStatusInput {
  content: string
  media_type?: 'text' | 'image' | 'video' | 'audio'
  media_url?: string
  background_color?: string
  text_color?: string
  expires_at?: string
}

export interface UpdatePresenceInput {
  status: 'online' | 'offline' | 'away' | 'busy'
}

// ============================================================================
// STATUS MODEL
// ============================================================================

export class StatusModel {
  /**
   * Create a new status for a user
   */
  static async createStatus(userId: string, input: CreateStatusInput): Promise<UserStatus> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .insert({
          user_id: userId,
          content: input.content,
          media_type: input.media_type || 'text',
          media_url: input.media_url,
          background_color: input.background_color || '#000000',
          text_color: input.text_color || '#ffffff',
          expires_at: input.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return data as UserStatus
    } catch (error) {
      console.error('[StatusModel] Create status error:', error)
      throw error
    }
  }

  /**
   * Get active status for a user
   */
  static async getActiveStatus(userId: string): Promise<UserStatus | null> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserStatus) || null
    } catch (error) {
      console.error('[StatusModel] Get active status error:', error)
      throw error
    }
  }

  /**
   * Get all statuses for a user
   */
  static async getUserStatuses(userId: string, limit: number = 10): Promise<UserStatus[]> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as UserStatus[]) || []
    } catch (error) {
      console.error('[StatusModel] Get user statuses error:', error)
      throw error
    }
  }

  /**
   * Update a status
   */
  static async updateStatus(statusId: string, userId: string, input: Partial<CreateStatusInput>): Promise<UserStatus> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .update({
          ...input,
          updated_at: new Date().toISOString()
        })
        .eq('id', statusId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserStatus
    } catch (error) {
      console.error('[StatusModel] Update status error:', error)
      throw error
    }
  }

  /**
   * Delete a status
   */
  static async deleteStatus(statusId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from('user_statuses')
        .delete()
        .eq('id', statusId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[StatusModel] Delete status error:', error)
      throw error
    }
  }

  /**
   * Deactivate a status
   */
  static async deactivateStatus(statusId: string, userId: string): Promise<UserStatus> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .update({ is_active: false })
        .eq('id', statusId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserStatus
    } catch (error) {
      console.error('[StatusModel] Deactivate status error:', error)
      throw error
    }
  }

  /**
   * Record a status view
   */
  static async recordStatusView(statusId: string, viewedByUserId: string): Promise<StatusView> {
    try {
      const { data, error } = await db
        .from('status_views')
        .upsert({
          status_id: statusId,
          viewed_by_user_id: viewedByUserId,
          viewed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as StatusView
    } catch (error) {
      console.error('[StatusModel] Record status view error:', error)
      throw error
    }
  }

  /**
   * Get status views (who viewed this status)
   */
  static async getStatusViews(statusId: string): Promise<StatusView[]> {
    try {
      const { data, error } = await db
        .from('status_views')
        .select('*')
        .eq('status_id', statusId)
        .order('viewed_at', { ascending: false })

      if (error) throw error
      return (data as StatusView[]) || []
    } catch (error) {
      console.error('[StatusModel] Get status views error:', error)
      throw error
    }
  }

  /**
   * Get view count for a status
   */
  static async getStatusViewCount(statusId: string): Promise<number> {
    try {
      const { count, error } = await db
        .from('status_views')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', statusId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[StatusModel] Get status view count error:', error)
      throw error
    }
  }

  /**
   * Clean up expired statuses
   */
  static async cleanupExpiredStatuses(): Promise<number> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select()

      if (error) throw error
      return (data as UserStatus[]).length
    } catch (error) {
      console.error('[StatusModel] Cleanup expired statuses error:', error)
      throw error
    }
  }
}

// ============================================================================
// PRESENCE MODEL
// ============================================================================

export class PresenceModel {
  /**
   * Update user presence status
   */
  static async updatePresence(userId: string, status: 'online' | 'offline' | 'away' | 'busy'): Promise<UserPresence> {
    try {
      const { data, error } = await db
        .from('user_presence')
        .upsert({
          user_id: userId,
          status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserPresence
    } catch (error) {
      console.error('[PresenceModel] Update presence error:', error)
      throw error
    }
  }

  /**
   * Get user presence
   */
  static async getPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await db
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserPresence) || null
    } catch (error) {
      console.error('[PresenceModel] Get presence error:', error)
      throw error
    }
  }

  /**
   * Get multiple users' presence
   */
  static async getPresenceMultiple(userIds: string[]): Promise<UserPresence[]> {
    try {
      const { data, error } = await db
        .from('user_presence')
        .select('*')
        .in('user_id', userIds)

      if (error) throw error
      return (data as UserPresence[]) || []
    } catch (error) {
      console.error('[PresenceModel] Get presence multiple error:', error)
      throw error
    }
  }

  /**
   * Set user online
   */
  static async setOnline(userId: string): Promise<UserPresence> {
    return this.updatePresence(userId, 'online')
  }

  /**
   * Set user offline
   */
  static async setOffline(userId: string): Promise<UserPresence> {
    return this.updatePresence(userId, 'offline')
  }

  /**
   * Set user away
   */
  static async setAway(userId: string): Promise<UserPresence> {
    return this.updatePresence(userId, 'away')
  }

  /**
   * Set user busy
   */
  static async setBusy(userId: string): Promise<UserPresence> {
    return this.updatePresence(userId, 'busy')
  }
}
