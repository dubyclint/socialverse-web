// FILE: /server/api/controllers/wallet-controller.js
// REFACTORED: Using lazy-loaded models

import * as UserWallet from '~/server/models/user-wallet'

export class WalletController {
  /**
   * Create wallet
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async createWallet(req, res) {
    try {
      const {
        user_id,
        wallet_address,
        chain_id,
        currency
      } = req.body

      // Check if wallet already exists
      const existingWallet = await UserWallet.findByUserAndCurrency(
        user_id,
        currency
      )

      if (existingWallet) {
        return res.status(400).json({
          error: 'Wallet already exists for this currency'
        })
      }

      const wallet = await UserWallet.create({
        user_id,
        wallet_address,
        chain_id,
        currency,
        balance: 0,
        locked_balance: 0,
        is_verified: false,
        is_primary: false,
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Wallet created successfully',
        data: wallet
      })
    } catch (error) {
      console.error('Error creating wallet:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create wallet'
      })
    }
  }

  /**
   * Get user wallets
   */
  static async getUserWallets(req, res) {
    try {
      const { user_id } = req.params

      const wallets = await UserWallet.findByUserId(user_id)

      return res.status(200).json({
        success: true,
        data: wallets
      })
    } catch (error) {
      console.error('Error fetching wallets:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch wallets'
      })
    }
  }

  /**
   * Get wallet by currency
   */
  static async getWalletByCurrency(req, res) {
    try {
      const { user_id, currency } = req.params

      const wallet = await UserWallet.findByUserAndCurrency(user_id, currency)

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' })
      }

      return res.status(200).json({
        success: true,
        data: wallet
      })
    } catch (error) {
      console.error('Error fetching wallet:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch wallet'
      })
    }
  }

  /**
   * Update wallet balance
   */
  static async updateWalletBalance(req, res) {
    try {
      const { user_id, currency } = req.params
      const { balance, locked_balance } = req.body

      const wallet = await UserWallet.updateBalance(user_id, currency, {
        balance,
        locked_balance,
        updated_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Wallet balance updated successfully',
        data: wallet
      })
    } catch (error) {
      console.error('Error updating wallet balance:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update wallet balance'
      })
    }
  }

  /**
   * Verify wallet
   */
  static async verifyWallet(req, res) {
    try {
      const { wallet_id } = req.params

      const wallet = await UserWallet.update(wallet_id, {
        is_verified: true,
        verified_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Wallet verified successfully',
        data: wallet
      })
    } catch (error) {
      console.error('Error verifying wallet:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to verify wallet'
      })
    }
  }
}
