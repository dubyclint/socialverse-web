// FILE: /server/api/controllers/notification.js
// REFACTORED: Using lazy-loaded models

import * as Notification from '~/server/models/notification'

export class NotificationController {
  /**
   * Create notification
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
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
      } = req.body

      const notification = await Notification.create({
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

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      })
    } catch (error) {
      console.error('Error creating notification:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create notification'
      })
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(req, res) {
    try {
      const { user_id } = req.params
      const { limit = 20, offset = 0 } = req.query

      const notifications = await Notification.findByUserId(
        user_id,
        parseInt(limit),
        parseInt(offset)
      )

      return res.status(200).json({
        success: true,
        data: notifications
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch notifications'
      })
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req, res) {
    try {
      const { notification_id } = req.params

      const notification = await Notification.update(notification_id, {
        is_read: true,
        read_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to mark notification as read'
      })
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(req, res) {
    try {
      const { notification_id } = req.params

      await Notification.delete(notification_id)

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete notification'
      })
    }
  }
}
