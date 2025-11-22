// server/api/controllers/notificationController.js
import { supabase } from '~/server/utils/database';

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
      return res.status(500).json({ error: error.message });
    }
  }

  // Get notifications
  static async getNotifications(req, res) {
    try {
      const { user_id, is_read } = req.query;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (is_read !== undefined) {
        query = query.eq('is_read', is_read === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { notification_id } = req.body;

      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
