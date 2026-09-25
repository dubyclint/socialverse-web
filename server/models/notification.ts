// FILE: /server/models/notification.ts
// Notification Model
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

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
// TYPES & INTERFACES
// ============================================================================
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'pewgift' | 'system'

export interface Notification {
  id: string
  user_id: string
  actor_id?: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class NotificationModel {
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    actorId?: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    try {
      const supabase = await getSupabase()
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          actor_id: actorId,
          type,
          title,
          message,
          data,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return notification as Notification
    } catch (error) {
      console.error('[NotificationModel] Error creating notification:', error)
      throw error
    }
  }

  static async getNotification(id: string): Promise<Notification | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[NotificationModel] Notification not found')
        return null
      }

      return data as Notification
    } catch (error) {
      console.error('[NotificationModel] Error fetching notification:', error)
      throw error
    }
  }

  static async getUserNotifications(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as Notification[]
    } catch (error) {
      console.error('[NotificationModel] Error fetching notifications:', error)
      throw error
    }
  }

  static async markAsRead(id: string): Promise<Notification> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Notification
    } catch (error) {
      console.error('[NotificationModel] Error marking as read:', error)
      throw error
    }
  }

  static async deleteNotification(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[NotificationModel] Error deleting notification:', error)
      throw error
    }
  }
}

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new notification
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function createInternal(data: {
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  sender_id?: string
  related_id?: string
}): Promise<Notification> {
  return NotificationModel.createNotification(
    data.user_id,
    data.type,
    data.title,
    data.message,
    data.sender_id,
    data.data
  )
}

/**
 * Find notification by ID
 */
export async function findById(id: string): Promise<Notification | null> {
  return NotificationModel.getNotification(id)
}

/**
 * Find notifications by user ID
 */
export async function findByUserId(
  userId: string,
  limit = 20,
  offset = 0
): Promise<Notification[]> {
  return NotificationModel.getUserNotifications(userId, limit, offset)
}

/**
 * Update notification
 */
export async function update(
  id: string,
  updates: Partial<Notification>
): Promise<Notification> {
  if (updates.read !== undefined) {
    return NotificationModel.markAsRead(id)
  }
  
  return NotificationModel.getNotification(id) as Promise<Notification>
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  return NotificationModel.markAsRead(id)
}

/**
 * Delete notification
 */
export async function delete_(id: string): Promise<void> {
  return NotificationModel.deleteNotification(id)
}

// Compatibility adapter: controllers expect `create` to be exported
export async function createNotificationAdapter(payload: any): Promise<Notification> {
  // map legacy keys to current create signature
  return createInternal({
    user_id: payload.userId || payload.user_id,
    type: payload.type || 'system',
    title: payload.title || payload.subject || '',
    message: payload.message || payload.body || '',
    data: payload.data,
    sender_id: payload.actorId || payload.sender_id
  })
}

// Also export `create` named to satisfy older imports
export const create = createNotificationAdapter

// Compatibility: static adapter on the class for older callers that do
// `NotificationModel.create(...)`
;(NotificationModel as any).create = async function (payload: any) {
  return createNotificationAdapter(payload)
}

// Export a runtime NotificationModel object to match older imports
export const NotificationModelRuntime: any = {
  create: createNotificationAdapter,
  findById,
  findByUserId,
  update,
  markAsRead,
  delete: delete_
}

// Also export default runtime-compatible name used elsewhere
export const NotificationModelAny: any = NotificationModelRuntime
