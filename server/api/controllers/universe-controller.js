// FILE: /server/api/controllers/universe-controller.js
// REFACTORED: Using lazy-loaded models

import * as UniverseMessage from '~/server/models/universe-message'

export class UniverseController {
  /**
   * Send message to universe chat
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async sendUniverseMessage(req, res) {
    try {
      const {
        sender_id,
        content,
        message_type,
        media_url,
        reply_to_id,
        location,
        is_anonymous
      } = req.body

      const message = await UniverseMessage.create({
        sender_id,
        content,
        message_type: message_type || 'text',
        media_url,
        reply_to_id,
        location,
        is_anonymous: is_anonymous || false,
        status: 'sent',
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Universe message sent successfully',
        data: message
      })
    } catch (error) {
      console.error('Error sending universe message:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to send universe message'
      })
    }
  }

  /**
   * Get universe messages
   */
  static async getUniverseMessages(req, res) {
    try {
      const { limit = 50, offset = 0, location } = req.query

      const messages = await UniverseMessage.findMessages(
        parseInt(limit),
        parseInt(offset),
        location
      )

      return res.status(200).json({
        success: true,
        data: messages
      })
    } catch (error) {
      console.error('Error fetching universe messages:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch universe messages'
      })
    }
  }

  /**
   * Get message replies
   */
  static async getMessageReplies(req, res) {
    try {
      const { message_id } = req.params
      const { limit = 20, offset = 0 } = req.query

      const replies = await UniverseMessage.findReplies(
        message_id,
        parseInt(limit),
        parseInt(offset)
      )

      return res.status(200).json({
        success: true,
        data: replies
      })
    } catch (error) {
      console.error('Error fetching message replies:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch message replies'
      })
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(req, res) {
    try {
      const { message_id } = req.params

      await UniverseMessage.delete(message_id)

      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting message:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete message'
      })
    }
  }
}
