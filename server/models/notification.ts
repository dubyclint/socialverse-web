// server/models/notification.ts
// Notification Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  read_at?: string
  created_at: string
}

export interface CreateNotificationInput {
  userId: string
  actorId?: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

export class NotificationModel {
  static async create(input: CreateNotificationInput): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: input.userId,
          actor_id: input.actorId,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data || {},
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Notification
    } catch (error) {
      console.error('[NotificationModel] Create error:', error)
      throw error
    }
  }

  static async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) throw error
      return data as Notification
    } catch (error) {
      console.error('[NotificationModel] Mark as read error:', error)
      throw error
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false)
    } catch (error) {
      console.error('[NotificationModel] Mark all as read error:', error)
      throw error
    }
  }

  static async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { notifications: (data as Notification[]) || [], total: count || 0 }
    } catch (error) {
      console.error('[NotificationModel] Get user notifications error:', error)
      throw error
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[NotificationModel] Get unread count error:', error)
      throw error
    }
  }

  static async delete(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[NotificationModel] Delete error:', error)
      throw error
    }
  }

  static async deleteAll(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('[NotificationModel] Delete all error:', error)
      throw error
    }
  }
}

export default NotificationModel
