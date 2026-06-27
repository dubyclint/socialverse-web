// FILE: /server/api/controllers/pewgift-controller.js
// REFACTORED: Using lazy-loaded models

import * as PewGift from '~/server/models/pewgift'
import * as UserWallet from '~/server/models/user-wallet'

export class GiftController {
  /**
   * Send gift
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async sendGift(req, res) {
    try {
      const {
        sender_id,
        receiver_id,
        gift_type,
        gift_name,
        gift_value,
        message,
        is_anonymous
      } = req.body

      if (sender_id === receiver_id) {
        return res.status(400).json({
          error: 'Cannot send gift to yourself'
        })
      }

      // Check sender's wallet balance if gift has value
      if (gift_value > 0) {
        const wallet = await UserWallet.findByCurrencyAndUser(
          sender_id,
          'USDT'
        )

        if (!wallet) {
          return res.status(404).json({ error: 'Sender wallet not found' })
        }

        if (parseFloat(wallet.balance) < parseFloat(gift_value)) {
          return res.status(400).json({
            error: 'Insufficient balance to send gift'
          })
        }

        // Deduct from sender's wallet
        await UserWallet.updateBalance(sender_id, 'USDT', {
          balance: parseFloat(wallet.balance) - parseFloat(gift_value),
          updated_at: new Date().toISOString()
        })
      }

      const gift = await PewGift.create({
        sender_id,
        receiver_id,
        gift_type,
        gift_name,
        gift_value,
        message,
        is_anonymous: is_anonymous || false,
        status: 'sent',
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Gift sent successfully',
        data: gift
      })
    } catch (error) {
      console.error('Error sending gift:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to send gift'
      })
    }
  }

  /**
   * Get received gifts
   */
  static async getReceivedGifts(req, res) {
    try {
      const { receiver_id } = req.params
      const { limit = 20, offset = 0 } = req.query

      const gifts = await PewGift.findByReceiverId(
        receiver_id,
        parseInt(limit),
        parseInt(offset)
      )

      return res.status(200).json({
        success: true,
        data: gifts
      })
    } catch (error) {
      console.error('Error fetching gifts:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch gifts'
      })
    }
  }

  /**
   * Accept gift
   */
  static async acceptGift(req, res) {
    try {
      const { gift_id } = req.params

      const gift = await PewGift.update(gift_id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Gift accepted',
        data: gift
      })
    } catch (error) {
      console.error('Error accepting gift:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to accept gift'
      })
    }
  }
}
