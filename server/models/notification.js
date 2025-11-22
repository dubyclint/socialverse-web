// server/models/notification.js - Supabase PostgreSQL Notification Model
import { supabase } from '../utils/supabase.js';

export class Notification {
  /**
   * Create a new notification
   */
  static async create(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          action_url: notificationData.actionUrl,
          priority: notificationData.priority || 'normal',
          delivery_method: notificationData.deliveryMethod || 'push',
          scheduled_for: notificationData.scheduledFor,
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    try {
      const { data, error, count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return { count: count || 0 };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;
      return { success: true, markedCount: data?.length || 0 };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(id, userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(notifications) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return { success: true, sentCount: data?.length || 0 };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications by type
   */
  static async getByType(userId, type, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications by type:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications
   */
  static async getUnreadNotifications(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for user
   */
  static async deleteAllNotifications(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  static async getStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read');

      if (error) throw error;

      const stats = {
        total: data.length,
        read: data.filter(n => n.is_read).length,
        unread: data.filter(n => !n.is_read).length,
        byType: {}
      };

      data.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = 0;
        }
        stats.byType[notification.type]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      throw error;
    }
  }

  /**
   * Schedule notification
   */
  static async scheduleNotification(notificationData, scheduledFor) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notificationData,
          scheduled_for: scheduledFor,
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }
}
