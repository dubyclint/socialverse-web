// server/ws/notificationEvents.js
const { supabase } = require('../../utils/supabase');

class NotificationEvents {
  static setupNotificationEvents(io, socket) {
    // Mark notification as read
    socket.on('mark_notification_read', async (data) => {
      try {
        const { notificationId } = data;
        const userId = socket.userId;

        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId)
          .eq('user_id', userId);

        socket.emit('notification_marked_read', {
          notificationId,
          success: true
        });

      } catch (error) {
        console.error('Mark notification read error:', error);
        socket.emit('notification_marked_read', {
          notificationId: data.notificationId,
          success: false,
          error: error.message
        });
      }
    });

    // Mark all notifications as read
    socket.on('mark_all_notifications_read', async () => {
      try {
        const userId = socket.userId;

        const { data: updatedNotifications } = await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_read', false)
          .select('id');

        socket.emit('all_notifications_marked_read', {
          success: true,
          count: updatedNotifications?.length || 0
        });

      } catch (error) {
        console.error('Mark all notifications read error:', error);
        socket.emit('all_notifications_marked_read', {
          success: false,
          error: error.message
        });
      }
    });

    // Get notification count
    socket.on('get_notification_count', async () => {
      try {
        const userId = socket.userId;

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        socket.emit('notification_count', {
          count: count || 0
        });

      } catch (error) {
        console.error('Get notification count error:', error);
        socket.emit('notification_count', {
          count: 0,
          error: error.message
        });
      }
    });

    // Subscribe to push notifications
    socket.on('subscribe_push_notifications', async (data) => {
      try {
        const { subscription, deviceInfo } = data;
        const userId = socket.userId;

        // Store push subscription
        await supabase
          .from('push_subscriptions')
          .upsert([{
            user_id: userId,
            subscription: subscription,
            device_info: deviceInfo,
            created_at: new Date().toISOString()
          }]);

        socket.emit('push_subscription_saved', {
          success: true
        });

      } catch (error) {
        console.error('Subscribe push notifications error:', error);
        socket.emit('push_subscription_saved', {
          success: false,
          error: error.message
        });
      }
    });

    // Update notification preferences
    socket.on('update_notification_preferences', async (data) => {
      try {
        const { preferences } = data;
        const userId = socket.userId;

        await supabase
          .from('user_settings')
          .upsert([{
            user_id: userId,
            notification_preferences: preferences,
            updated_at: new Date().toISOString()
          }]);

        socket.emit('notification_preferences_updated', {
          success: true,
          preferences
        });

      } catch (error) {
        console.error('Update notification preferences error:', error);
        socket.emit('notification_preferences_updated', {
          success: false,
          error: error.message
        });
      }
    });
  }

  // Helper method to send notification to user
  static async sendNotificationToUser(io, userId, notification) {
    try {
      // Store notification in database
      const { data: savedNotification } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      // Send real-time notification if user is online
      const userSocketId = io.connectedUsers?.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit('new_notification', savedNotification);
      }

      // Send push notification if user is offline
      if (!userSocketId) {
        await this.sendPushNotification(userId, notification);
      }

      return savedNotification;

    } catch (error) {
      console.error('Send notification to user error:', error);
      return null;
    }
  }

  static async sendPushNotification(userId, notification) {
    try {
      // Get user's push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) {
        return;
      }

      // Send push notification to each subscription
      // This would integrate with your push notification service
      // (Firebase, OneSignal, Web Push, etc.)
      
      console.log(`Sending push notification to user ${userId}:`, notification);
      
      // Implement actual push notification sending here
      
    } catch (error) {
      console.error('Send push notification error:', error);
    }
  }
}

module.exports = NotificationEvents;
