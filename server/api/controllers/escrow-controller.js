// FILE: /server/api/controllers/escrow-controller.js
// REFACTORED: Using lazy-loaded models
// Breaks transitive dependency chain

import * as EscrowTrade from '~/server/models/escrow-trade'
import * as UserWallet from '~/server/models/user-wallet'

export class EscrowController {
  /**
   * Create escrow deal
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async createEscrow(req, res) {
    try {
      const {
        buyer_id,
        seller_id,
        trade_id,
        amount,
        currency,
        terms,
        auto_release_hours,
        description
      } = req.body

      if (buyer_id === seller_id) {
        return res.status(400).json({
          error: 'Buyer and seller cannot be the same user'
        })
      }

      // Verify buyer has sufficient balance
      const buyerWallet = await UserWallet.findByCurrencyAndUser(
        buyer_id,
        currency
      )

      if (!buyerWallet) {
        return res.status(404).json({ error: 'Buyer wallet not found' })
      }

      if (parseFloat(buyerWallet.balance) < parseFloat(amount)) {
        return res.status(400).json({
          error: 'Insufficient balance to create escrow'
        })
      }

      // Create escrow trade
      const escrow = await EscrowTrade.create({
        buyer_id,
        seller_id,
        trade_id,
        amount,
        currency,
        terms,
        auto_release_hours: auto_release_hours || 48,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      // Lock amount in buyer's wallet
      await UserWallet.updateBalance(buyer_id, currency, {
        balance: parseFloat(buyerWallet.balance) - parseFloat(amount),
        locked_balance: parseFloat(buyerWallet.locked_balance) + parseFloat(amount),
        updated_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Escrow created successfully',
        data: escrow
      })
    } catch (error) {
      console.error('Error creating escrow:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create escrow'
      })
    }
  }

  /**
   * Release escrow funds to seller
   */
  static async releaseEscrow(req, res) {
    try {
      const { escrow_id } = req.params

      const escrow = await EscrowTrade.findById(escrow_id)

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' })
      }

      if (escrow.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending escrows can be released'
        })
      }

      // Update buyer wallet
      const buyerWallet = await UserWallet.findByCurrencyAndUser(
        escrow.buyer_id,
        escrow.currency
      )

      await UserWallet.updateBalance(escrow.buyer_id, escrow.currency, {
        locked_balance: parseFloat(buyerWallet.locked_balance) - parseFloat(escrow.amount),
        updated_at: new Date().toISOString()
      })

      // Update seller wallet
      const sellerWallet = await UserWallet.findByCurrencyAndUser(
        escrow.seller_id,
        escrow.currency
      )

      await UserWallet.updateBalance(escrow.seller_id, escrow.currency, {
        balance: parseFloat(sellerWallet.balance) + parseFloat(escrow.amount),
        updated_at: new Date().toISOString()
      })

      // Update escrow status
      const updatedEscrow = await EscrowTrade.update(escrow_id, {
        status: 'released',
        released_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Escrow released successfully',
        data: updatedEscrow
      })
    } catch (error) {
      console.error('Error releasing escrow:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to release escrow'
      })
    }
  }

  /**
   * Cancel escrow and refund buyer
   */
  static async cancelEscrow(req, res) {
    try {
      const { escrow_id } = req.params

      const escrow = await EscrowTrade.findById(escrow_id)

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' })
      }

      if (escrow.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending escrows can be cancelled'
        })
      }

      // Refund buyer
      const buyerWallet = await UserWallet.findByCurrencyAndUser(
        escrow.buyer_id,
        escrow.currency
      )

      await UserWallet.updateBalance(escrow.buyer_id, escrow.currency, {
        balance: parseFloat(buyerWallet.balance) + parseFloat(escrow.amount),
        locked_balance: parseFloat(buyerWallet.locked_balance) - parseFloat(escrow.amount),
        updated_at: new Date().toISOString()
      })

      // Update escrow status
      const updatedEscrow = await EscrowTrade.update(escrow_id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Escrow cancelled successfully',
        data: updatedEscrow
      })
    } catch (error) {
      console.error('Error cancelling escrow:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel escrow'
      })
    }
  }
}
