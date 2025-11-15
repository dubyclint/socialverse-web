// server/api/controllers/notificationController.js
import { supabase } from '../../utils/supabase';

export class NotificationController {
  // Create notification
  static async createNotification(req, res) {
    try {
      const {
        user_id,
        type,
        title,
        message,
        data,
        sender_id,
        related_id
      } = req.body;

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          type,
          title,
          message,
          data,
          sender_id,
          related_id,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, unread_only = false } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:users!notifications_sender_id_fkey(id, username, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      const { data: notifications, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const { user_id } = req.body;

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const { userId } = req.params;

      const { data: notifications, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { updated_count: notifications.length }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const { user_id } = req.body;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user_id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get unread count
  static async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send bulk notifications
  static async sendBulkNotifications(req, res) {
    try {
      const { user_ids, type, title, message, data, sender_id } = req.body;

      const notifications = user_ids.map(user_id => ({
        user_id,
        type,
        title,
        message,
        data,
        sender_id,
        is_read: false,
        created_at: new Date().toISOString()
      }));

      const { data: createdNotifications, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Bulk notifications sent successfully',
        data: { sent_count: createdNotifications.length }
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(req, res) {
    try {
      const { userId } = req.params;

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, return defaults
        const defaultPreferences = {
          pew_notifications: true,
          gift_notifications: true,
          trade_notifications: true,
          pal_requests: true,
          post_interactions: true,
          email_notifications: false,
          push_notifications: true
        };

        return res.status(200).json({
          success: true,
          data: defaultPreferences
        });
      }

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(req, res) {
    try {
      const { userId } = req.params;
      const preferences = req.body;

      const { data: updatedPreferences, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
