// FILE: /server/models/user-status-legacy.ts
// Legacy User Status (Sequelize) - DEPRECATED
// Use /server/models/status.ts instead
// Converted from: userStatus.js

import { db } from '~/server/utils/database'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LegacyUserStatus {
  id: string
  user_id: string
  content?: string
  media_url?: string
  media_type: 'text' | 'image' | 'video' | 'audio'
  media_metadata?: Record<string, any>
  background_color: string
  text_color: string
  view_count: number
  is_active: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

// ============================================================================
// LEGACY USER STATUS MODEL
// ============================================================================

/**
 * @deprecated Use StatusModel from /server/models/status.ts instead
 * This model is kept for backward compatibility only
 */
export class LegacyUserStatusModel {
  /**
   * Get user status (legacy)
   * @deprecated Use StatusModel.getActiveStatus() instead
   */
  static async getStatus(userId: string): Promise<LegacyUserStatus | null> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as LegacyUserStatus) || null
    } catch (error) {
      console.error('[LegacyUserStatusModel] Get status error:', error)
      throw error
    }
  }

  /**
   * Update user status (legacy)
   * @deprecated Use StatusModel.updateStatus() instead
   */
  static async updateStatus(userId: string, content: string, mediaUrl?: string): Promise<LegacyUserStatus> {
    try {
      const { data, error } = await db
        .from('user_statuses')
        .update({
          content,
          media_url: mediaUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as LegacyUserStatus
    } catch (error) {
      console.error('[LegacyUserStatusModel] Update status error:', error)
      throw error
    }
  }

  /**
   * Clear user status (legacy)
   * @deprecated Use StatusModel.deactivateStatus() instead
   */
  static async clearStatus(userId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from('user_statuses')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[LegacyUserStatusModel] Clear status error:', error)
      throw error
    }
  }
}
