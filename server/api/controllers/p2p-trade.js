// FILE: /server/api/controllers/p2p-trade.js
// REFACTORED: Using lazy-loaded models

import * as Trade from '~/server/models/trade'
import * as UserWallet from '~/server/models/user-wallet'

export class TradeController {
  /**
   * Create new trade
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async createTrade(req, res) {
    try {
      const {
        user_id,
        trade_type,
        currency_from,
        currency_to,
        amount_from,
        amount_to,
        exchange_rate,
        description,
        payment_methods,
        min_amount,
        max_amount
      } = req.body

      const trade = await Trade.create({
        user_id,
        trade_type,
        currency_from,
        currency_to,
        amount_from,
        amount_to,
        exchange_rate,
        description,
        payment_methods,
        min_amount,
        max_amount,
        status: 'active',
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Trade created successfully',
        data: trade
      })
    } catch (error) {
      console.error('Error creating trade:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create trade'
      })
    }
  }

  /**
   * Get trade by ID
   */
  static async getTrade(req, res) {
    try {
      const { trade_id } = req.params

      const trade = await Trade.findById(trade_id)

      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' })
      }

      return res.status(200).json({
        success: true,
        data: trade
      })
    } catch (error) {
      console.error('Error fetching trade:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch trade'
      })
    }
  }

  /**
   * Update trade
   */
  static async updateTrade(req, res) {
    try {
      const { trade_id } = req.params
      const updates = req.body

      const trade = await Trade.update(trade_id, updates)

      return res.status(200).json({
        success: true,
        message: 'Trade updated successfully',
        data: trade
      })
    } catch (error) {
      console.error('Error updating trade:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update trade'
      })
    }
  }

  /**
   * Close trade
   */
  static async closeTrade(req, res) {
    try {
      const { trade_id } = req.params

      const trade = await Trade.update(trade_id, {
        status: 'closed',
        closed_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Trade closed successfully',
        data: trade
      })
    } catch (error) {
      console.error('Error closing trade:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to close trade'
      })
    }
  }
}
