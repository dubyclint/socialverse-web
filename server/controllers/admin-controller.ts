// server/controllers/admin-controller.ts
// ============================================================================
// CONSOLIDATED ADMIN CONTROLLER
// Merges: admin-controller.js + admin-push-controller.js + dashboard-admin-controller.js
// ============================================================================

import { supabase, logAdminAction } from '~/server/utils/auth-utils'
import { sendPush } from '~/push-engine'
import type { H3Event } from 'h3'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AdminStats {
  total_users: number
  active_users: number
  total_posts: number
  flagged_posts: number
  pending_matches: number
  total_escrows: number
  pending_escrows: number
}

export interface AdminAction {
  action: string
  targetId: string
  targetType: string
  reason?: string
  metadata?: Record<string, any>
}

// ============================================================================
// ADMIN CONTROLLER
// ============================================================================

export class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(event: H3Event) {
    try {
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      // Check admin role
      await this.verifyAdminRole(adminId)

      const { data, error } = await supabase.rpc('get_admin_stats')

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching admin stats:', error)
      throw error
    }
  }

  /**
   * Get users list
   */
  static async getUsers(event: H3Event) {
    try {
      const adminId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50
      const offset = parseInt(query.offset as string) || 0

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return { success: true, data: users || [] }
    } catch (error: any) {
      console.error('Error getting users:', error)
      throw error
    }
  }

  /**
   * Ban user
   */
  static async banUser(event: H3Event) {
    try {
      const body = await readBody(event)
      const { userId, reason } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: user, error } = await supabase
        .from('users')
        .update({ is_banned: true, ban_reason: reason })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'user_ban', userId, 'user', { reason })

      // Send notification to user
      if (user?.device_token) {
        await sendPush(user.device_token, '⛔ Account Banned', `Your account has been banned. Reason: ${reason}`)
      }

      return { success: true, message: 'User banned', data: user }
    } catch (error: any) {
      console.error('Error banning user:', error)
      throw error
    }
  }

  /**
   * Unban user
   */
  static async unbanUser(event: H3Event) {
    try {
      const body = await readBody(event)
      const { userId } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: user, error } = await supabase
        .from('users')
        .update({ is_banned: false, ban_reason: null })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'user_unban', userId, 'user')

      // Send notification to user
      if (user?.device_token) {
        await sendPush(user.device_token, '✅ Account Restored', 'Your account has been restored.')
      }

      return { success: true, message: 'User unbanned', data: user }
    } catch (error: any) {
      console.error('Error unbanning user:', error)
      throw error
    }
  }

  /**
   * Verify user
   */
  static async verifyUser(event: H3Event) {
    try {
      const body = await readBody(event)
      const { userId, verified } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: user, error } = await supabase
        .from('users')
        .update({ is_verified: verified })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, verified ? 'user_verify' : 'user_unverify', userId, 'user')

      return { success: true, message: 'User verification updated', data: user }
    } catch (error: any) {
      console.error('Error verifying user:', error)
      throw error
    }
  }

  // ============================================================================
  // POST MANAGEMENT
  // ============================================================================

  /**
   * Get posts
   */
  static async getPosts(event: H3Event) {
    try {
      const adminId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50
      const flaggedOnly = query.flagged === 'true'

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      let q = supabase.from('posts').select('*')

      if (flaggedOnly) {
        q = q.eq('flagged', true)
      }

      const { data: posts, error } = await q
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: posts || [] }
    } catch (error: any) {
      console.error('Error getting posts:', error)
      throw error
    }
  }

  /**
   * Flag post
   */
  static async flagPost(event: H3Event) {
    try {
      const body = await readBody(event)
      const { postId, reason } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: post, error } = await supabase
        .from('posts')
        .update({ flagged: true, flag_reason: reason })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'post_flag', postId, 'post', { reason })

      // Notify post owner
      if (post?.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('device_token')
          .eq('id', post.user_id)
          .single()

        if (user?.device_token) {
          await sendPush(user.device_token, '⚠️ Post Flagged', `Your post has been flagged. Reason: ${reason}`)
        }
      }

      return { success: true, message: 'Post flagged', data: post }
    } catch (error: any) {
      console.error('Error flagging post:', error)
      throw error
    }
  }

  /**
   * Delete post
   */
  static async deletePost(event: H3Event) {
    try {
      const body = await readBody(event)
      const { postId, reason } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: post, error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .select()
        .single()

      if (deleteError) throw deleteError

      // Log admin action
      await logAdminAction(adminId, 'post_delete', postId, 'post', { reason })

      // Notify post owner
      if (post?.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('device_token')
          .eq('id', post.user_id)
          .single()

        if (user?.device_token) {
          await sendPush(user.device_token, '❌ Post Deleted', `Your post has been deleted. Reason: ${reason}`)
        }
      }

      return { success: true, message: 'Post deleted' }
    } catch (error: any) {
      console.error('Error deleting post:', error)
      throw error
    }
  }

  // ============================================================================
  // MATCH MANAGEMENT
  // ============================================================================

  /**
   * Get pending match requests
   */
  static async getMatchRequests(event: H3Event) {
    try {
      const adminId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: requests, error } = await supabase
        .from('match_requests')
        .select('*')
        .eq('approved_by_admin', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: requests || [] }
    } catch (error: any) {
      console.error('Error getting match requests:', error)
      throw error
    }
  }

  /**
   * Approve match
   */
  static async approveMatch(event: H3Event) {
    try {
      const body = await readBody(event)
      const { requestId, matchedUserId } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: request, error } = await supabase
        .from('match_requests')
        .update({ approved_by_admin: true, matched_user_id: matchedUserId })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'match_approve', requestId, 'match_request')

      // Send push notifications
      const { data: user } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', request.user_id)
        .single()

      if (user?.device_token) {
        await sendPush(user.device_token, '✅ Match Approved', 'Your pal request has been approved!')
      }

      return { success: true, message: 'Match approved', data: request }
    } catch (error: any) {
      console.error('Error approving match:', error)
      throw error
    }
  }

  /**
   * Reject match
   */
  static async rejectMatch(event: H3Event) {
    try {
      const body = await readBody(event)
      const { requestId, reason } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: request, error } = await supabase
        .from('match_requests')
        .update({ approved_by_admin: false, rejection_reason: reason })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'match_reject', requestId, 'match_request', { reason })

      // Send push notification
      const { data: user } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', request.user_id)
        .single()

      if (user?.device_token) {
        await sendPush(user.device_token, '❌ Match Rejected', `Your pal request was rejected. Reason: ${reason}`)
      }

      return { success: true, message: 'Match rejected', data: request }
    } catch (error: any) {
      console.error('Error rejecting match:', error)
      throw error
    }
  }

  // ============================================================================
  // ESCROW MANAGEMENT
  // ============================================================================

  /**
   * Get pending escrows
   */
  static async getPendingEscrows(event: H3Event) {
    try {
      const adminId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: escrows, error } = await supabase
        .from('escrow_trades')
        .select('*')
        .eq('status', 'disputed')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: escrows || [] }
    } catch (error: any) {
      console.error('Error getting pending escrows:', error)
      throw error
    }
  }

  /**
   * Release escrow
   */
  static async releaseEscrow(event: H3Event) {
    try {
      const body = await readBody(event)
      const { escrowId } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: escrow, error } = await supabase
        .from('escrow_trades')
        .update({ status: 'released', is_released: true })
        .eq('id', escrowId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'escrow_release', escrowId, 'escrow')

      // Send push notifications
      const { data: seller } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', escrow.seller_id)
        .single()

      if (seller?.device_token) {
        await sendPush(seller.device_token, '💰 Escrow Released', 'Your trade funds have been released.')
      }

      return { success: true, message: 'Escrow released', data: escrow }
    } catch (error: any) {
      console.error('Error releasing escrow:', error)
      throw error
    }
  }

  /**
   * Refund escrow
   */
  static async refundEscrow(event: H3Event) {
    try {
      const body = await readBody(event)
      const { escrowId, reason } = body
      const adminId = event.context.user?.id

      if (!adminId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      await this.verifyAdminRole(adminId)

      const { data: escrow, error } = await supabase
        .from('escrow_trades')
        .update({ status: 'refunded', is_refunded: true })
        .eq('id', escrowId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await logAdminAction(adminId, 'escrow_refund', escrowId, 'escrow', { reason })

      // Send push notifications
      const { data: buyer } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', escrow.buyer_id)
        .single()

      if (buyer?.device_token) {
        await sendPush(buyer.device_token, '↩️ Escrow Refunded', `Your trade has been refunded. Reason: ${reason}`)
      }

      return { success: true, message: 'Escrow refunded', data: escrow }
    } catch (error: any) {
      console.error('Error refunding escrow:', error)
      throw error
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Verify admin role
   */
  private static async verifyAdminRole(userId: string): Promise<void> {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }
  }
}
