// FILE: /server/models/status-view-legacy.ts
// Legacy Status View (Sequelize) - DEPRECATED
// Use /server/models/status.ts instead
// Converted from: status-view.js

import { db } from '~/server/utils/database'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LegacyStatusView {
  id: string
  status_id: string
  viewer_id: string
  viewed_at: string
}

// ============================================================================
// LEGACY STATUS VIEW MODEL
// ============================================================================

/**
 * @deprecated Use StatusModel from /server/models/status.ts instead
 * This model is kept for backward compatibility only
 */
export class LegacyStatusViewModel {
  /**
   * Record a status view (legacy)
   * @deprecated Use StatusModel.recordStatusView() instead
   */
  static async recordView(statusId: string, viewerId: string): Promise<LegacyStatusView> {
    try {
      const { data, error } = await db
        .from('status_views')
        .upsert({
          status_id: statusId,
          viewer_id: viewerId,
          viewed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as LegacyStatusView
    } catch (error) {
      console.error('[LegacyStatusViewModel] Record view error:', error)
      throw error
    }
  }

  /**
   * Get status viewers (legacy)
   * @deprecated Use StatusModel.getStatusViews() instead
   */
  static async getViewers(statusId: string): Promise<LegacyStatusView[]> {
    try {
      const { data, error } = await db
        .from('status_views')
        .select('*')
        .eq('status_id', statusId)
        .order('viewed_at', { ascending: false })

      if (error) throw error
      return (data as LegacyStatusView[]) || []
    } catch (error) {
      console.error('[LegacyStatusViewModel] Get viewers error:', error)
      throw error
    }
  }

  /**
   * Get view count (legacy)
   * @deprecated Use StatusModel.getStatusViewCount() instead
   */
  static async getViewCount(statusId: string): Promise<number> {
    try {
      const { count, error } = await db
        .from('status_views')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', statusId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[LegacyStatusViewModel] Get view count error:', error)
      throw error
    }
  }
}
