// FILE: /server/models/notification.ts
// Notification Model
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

  // ... rest of the methods
}
