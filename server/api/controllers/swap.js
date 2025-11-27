// FILE: /server/api/controllers/swap.js
// REFACTORED: Using lazy-loaded models instead of direct Supabase import
// This breaks the transitive dependency chain completely
// ============================================================================

import * as UserWallet from '~/server/models/user-wallet'
import * as SwapTransaction from '~/server/models/swap-transaction'

export class SwapController {
  /**
   * Create swap transaction
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async createSwap(req, res) {
    try {
      const {
        user_id,
        from_currency,
        to_currency,
        from_amount,
        to_amount,
        exchange_rate,
        swap_type,
        slippage_tolerance
      } = req.body

      // Verify user has sufficient balance
      // ✅ Uses lazy-loaded model - Supabase loads here, not at import time
      const fromWallet = await UserWallet.findByCurrencyAndUser(
        user_id,
        from_currency
      )

      if (!fromWallet) {
        return res.status(404).json({ error: 'Wallet not found' })
      }

      const availableBalance = parseFloat(fromWallet.balance)
      if (availableBalance < parseFloat(from_amount)) {
        return res.status(400).json({ error: 'Insufficient balance for swap' })
      }

      // Lock the from_amount in user's wallet
      // ✅ Uses lazy-loaded model
      await UserWallet.updateBalance(
        user_id,
        from_currency,
        {
          balance: availableBalance - parseFloat(from_amount),
          locked_balance: parseFloat(fromWallet.locked_balance) + parseFloat(from_amount),
          updated_at: new Date().toISOString()
        }
      )

      // Create swap transaction
      // ✅ Uses lazy-loaded model
      const swap = await SwapTransaction.create({
        user_id,
        from_currency,
        to_currency,
        from_amount,
        to_amount,
        exchange_rate,
        swap_type: swap_type || 'instant',
        slippage_tolerance: slippage_tolerance || 0.5,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Swap transaction created successfully',
        data: swap
      })
    } catch (error) {
      console.error('Error creating swap:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create swap'
      })
    }
  }

  /**
   * Execute swap transaction
   */
  static async executeSwap(req, res) {
    try {
      const { swapId } = req.params
      const { execution_rate } = req.body

      // Get swap details
      // ✅ Uses lazy-loaded model
      const swap = await SwapTransaction.findById(swapId)

      if (!swap || swap.status !== 'pending') {
        return res.status(404).json({
          error: 'Swap transaction not found or already processed'
        })
      }

      // Calculate actual amounts with execution rate
      const actualToAmount = parseFloat(swap.from_amount) * parseFloat(execution_rate)
      const slippagePercent = Math.abs(
        (actualToAmount - parseFloat(swap.to_amount)) / parseFloat(swap.to_amount)
      ) * 100

      if (slippagePercent > parseFloat(swap.slippage_tolerance)) {
        // Revert the locked amount
        const fromWallet = await UserWallet.findByCurrencyAndUser(
          swap.user_id,
          swap.from_currency
        )

        await UserWallet.updateBalance(
          swap.user_id,
          swap.from_currency,
          {
            balance: parseFloat(fromWallet.balance) + parseFloat(swap.from_amount),
            locked_balance: parseFloat(fromWallet.locked_balance) - parseFloat(swap.from_amount)
          }
        )

        await SwapTransaction.update(swapId, {
          status: 'failed',
          failure_reason: 'Slippage tolerance exceeded',
          failed_at: new Date().toISOString()
        })

        return res.status(400).json({ error: 'Slippage tolerance exceeded' })
      }

      // Execute the swap
      // 1. Remove locked amount from source wallet
      const fromWallet = await UserWallet.findByCurrencyAndUser(
        swap.user_id,
        swap.from_currency
      )

      await UserWallet.updateBalance(
        swap.user_id,
        swap.from_currency,
        {
          locked_balance: parseFloat(fromWallet.locked_balance) - parseFloat(swap.from_amount)
        }
      )

      // 2. Add to destination wallet
      const toWallet = await UserWallet.findByCurrencyAndUser(
        swap.user_id,
        swap.to_currency
      )

      await UserWallet.updateBalance(
        swap.user_id,
        swap.to_currency,
        {
          balance: parseFloat(toWallet.balance) + actualToAmount,
          updated_at: new Date().toISOString()
        }
      )

      // 3. Update swap transaction
      const completedSwap = await SwapTransaction.update(swapId, {
        status: 'completed',
        execution_rate,
        actual_to_amount: actualToAmount,
        executed_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Swap executed successfully',
        data: completedSwap
      })
    } catch (error) {
      console.error('Error executing swap:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute swap'
      })
    }
  }

  /**
   * Get user swap history
   */
  static async getUserSwaps(req, res) {
    try {
      const { userId } = req.params
      const { page = 1, limit = 20, status } = req.query
      const offset = (page - 1) * limit

      // ✅ Uses lazy-loaded model
      const swaps = await SwapTransaction.findByUserId(
        userId,
        parseInt(limit),
        parseInt(offset),
        status
      )

      return res.status(200).json({
        success: true,
        data: swaps,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      console.error('Error fetching user swaps:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch user swaps'
      })
    }
  }

  /**
   * Cancel pending swap
   */
  static async cancelSwap(req, res) {
    try {
      const { swapId } = req.params
      const { user_id } = req.body

      // Get swap details
      // ✅ Uses lazy-loaded model
      const swap = await SwapTransaction.findById(swapId)

      if (!swap || swap.user_id !== user_id || swap.status !== 'pending') {
        return res.status(404).json({
          error: 'Swap transaction not found or cannot be cancelled'
        })
      }

      // Unlock the locked amount
      const fromWallet = await UserWallet.findByCurrencyAndUser(
        user_id,
        swap.from_currency
      )

      await UserWallet.updateBalance(
        user_id,
        swap.from_currency,
        {
          balance: parseFloat(fromWallet.balance) + parseFloat(swap.from_amount),
          locked_balance: parseFloat(fromWallet.locked_balance) - parseFloat(swap.from_amount),
          updated_at: new Date().toISOString()
        }
      )

      // Update swap status
      const cancelledSwap = await SwapTransaction.update(swapId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Swap cancelled successfully',
        data: cancelledSwap
      })
    } catch (error) {
      console.error('Error cancelling swap:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to cancel swap'
      })
    }
  }

  /**
   * Get current exchange rates
   */
  static async getExchangeRates(req, res) {
    try {
      const { from_currency, to_currency } = req.query

      // Mock exchange rates - in production, this would come from external APIs
      const exchangeRates = {
        'USDT': {
          'USDC': 1.001,
          'BTC': 0.000023,
          'ETH': 0.00041,
          'SOL': 0.0067,
          'MATIC': 1.25,
          'XAUT': 0.00051
        },
        'BTC': {
          'USDT': 43500.00,
          'USDC': 43525.00,
          'ETH': 17.8,
          'SOL': 291.2,
          'MATIC': 54375.0,
          'XAUT': 22.15
        },
        'ETH': {
          'USDT': 2445.00,
          'USDC': 2447.50,
          'BTC': 0.056,
          'SOL': 16.35,
          'MATIC': 3056.25,
          'XAUT': 1.245
        }
      }

      let rates = exchangeRates

      if (from_currency && to_currency) {
        const rate = exchangeRates[from_currency]?.[to_currency]
        if (!rate) {
          return res.status(404).json({
            error: 'Exchange rate not available for this pair'
          })
        }
        rates = { [from_currency]: { [to_currency]: rate } }
      }

      return res.status(200).json({
        success: true,
        data: {
          rates,
          timestamp: new Date().toISOString(),
          source: 'internal'
        }
      })
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch exchange rates'
      })
    }
  }

  /**
   * Get swap statistics
   */
  static async getSwapStats(req, res) {
    try {
      const { userId } = req.params

      // ✅ Uses lazy-loaded model
      const swaps = await SwapTransaction.findByUserId(userId)

      const stats = {
        total_swaps: swaps.length,
        completed_swaps: swaps.filter(s => s.status === 'completed').length,
        failed_swaps: swaps.filter(s => s.status === 'failed').length,
        total_volume_usd: 0,
        success_rate: 0,
        favorite_pairs: {}
      }

      // Calculate success rate
      if (stats.total_swaps > 0) {
        stats.success_rate = Math.round(
          (stats.completed_swaps / stats.total_swaps) * 100
        )
      }

      // Calculate favorite trading pairs
      swaps.forEach(swap => {
        const pair = `${swap.from_currency}/${swap.to_currency}`
        stats.favorite_pairs[pair] = (stats.favorite_pairs[pair] || 0) + 1
      })

      return res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error fetching swap stats:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch swap stats'
      })
    }
  }

  /**
   * Estimate swap
   */
  static async estimateSwap(req, res) {
    try {
      const { from_currency, to_currency, from_amount } = req.query

      if (!from_currency || !to_currency || !from_amount) {
        return res.status(400).json({
          error: 'Missing required parameters'
        })
      }

      // Get current exchange rate (mock)
      const exchangeRates = {
        'USDT/USDC': 1.001,
        'USDT/BTC': 0.000023,
        'USDT/ETH': 0.00041,
        'BTC/USDT': 43500.00,
        'ETH/USDT': 2445.00
      }

      const pair = `${from_currency}/${to_currency}`
      const rate = exchangeRates[pair]

      if (!rate) {
        return res.status(404).json({
          error: 'Exchange rate not available for this pair'
        })
      }

      const estimatedAmount = parseFloat(from_amount) * rate
      const networkFee = estimatedAmount * 0.001 // 0.1% fee
      const finalAmount = estimatedAmount - networkFee

      return res.status(200).json({
        success: true,
        data: {
          from_currency,
          to_currency,
          from_amount: parseFloat(from_amount),
          estimated_rate: rate,
          estimated_amount: estimatedAmount,
          network_fee: networkFee,
          final_amount: finalAmount,
          slippage_tolerance: 0.5,
          valid_until: new Date(Date.now() + 30000).toISOString() // 30 seconds
        }
      })
    } catch (error) {
      console.error('Error estimating swap:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to estimate swap'
      })
    }
  }
}
