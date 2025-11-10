// server/models/notification.js - Supabase PostgreSQL Notification Model
import { supabase } from '../utils/supabase.js';

export class Notification {
  static async create(notificationData) {
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
        scheduled_for: notificationData.scheduledFor
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserNotifications(userId, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getUnreadCount(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return { count: data.length };
  }

  static async markAsRead(notificationId) {
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
  }

  static async markAllAsRead(userId) {
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
    return data;
  }

  static async deleteNotification(id, userId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  static async sendBulkNotifications(notifications) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) throw error;
    return data;
  }
}
