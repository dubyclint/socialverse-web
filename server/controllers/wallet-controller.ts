// server/controllers/wallet-controller.ts
// ============================================================================
// CONSOLIDATED WALLET CONTROLLER
// Merges: user-wallet-controller.js + wallet-lock-controller.js
// ============================================================================

import { UserWalletModel } from '~/server/models/user-wallet'
import { getSupabaseClient } from '~/server/utils/database'
import type { H3Event } from 'h3'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WalletLockRequest {
  walletId: string
  currency: string
  amount: number
  reason: string
  scheduledUnlock?: string
}

export interface WalletTransferRequest {
  fromCurrency: string
  toCurrency: string
  amount: number
}

// ============================================================================
// WALLET CONTROLLER
// ============================================================================

export class WalletController {
  /**
   * Get user's wallet
   */
  static async getWallet(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const wallet = await UserWalletModel.getByUserId(userId)

      if (!wallet) {
        // Create wallet if doesn't exist
        const newWallet = await UserWalletModel.create(userId)
        return { success: true, data: newWallet }
      }

      return { success: true, data: wallet }
    } catch (error: any) {
      console.error('Error getting wallet:', error)
      throw error
    }
  }

  /**
   * Get wallet by ID
   */
  static async getWalletById(event: H3Event) {
    try {
      const { walletId } = getRouterParams(event)

      const wallet = await UserWalletModel.getById(walletId)

      if (!wallet) {
        throw createError({ statusCode: 404, statusMessage: 'Wallet not found' })
      }

      return { success: true, data: wallet }
    } catch (error: any) {
      console.error('Error getting wallet by ID:', error)
      throw error
    }
  }

  /**
   * Get wallet balance
   */
  static async getBalance(event: H3Event) {
    try {
      const userId = event.context.user?.id
      const query = getQuery(event)
      const currency = query.currency as string

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      if (!currency) {
        throw createError({ statusCode: 400, statusMessage: 'Currency is required' })
      }

      const balance = await UserWalletModel.getBalance(userId, currency as any)

      return { success: true, data: { currency, balance } }
    } catch (error: any) {
      console.error('Error getting balance:', error)
      throw error
    }
  }

  /**
   * Get total balance
   */
  static async getTotalBalance(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const totalBalance = await UserWalletModel.getTotalBalance(userId)

      return { success: true, data: { total_balance_usd: totalBalance } }
    } catch (error: any) {
      console.error('Error getting total balance:', error)
      throw error
    }
  }

  /**
   * Update wallet balance
   */
  static async updateBalance(event: H3Event) {
    try {
      const body = await readBody(event)
      const { currency, amount } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      if (!currency || amount === undefined) {
        throw createError({ statusCode: 400, statusMessage: 'Currency and amount are required' })
      }

      const wallet = await UserWalletModel.updateBalance(userId, currency, amount)

      return { success: true, data: wallet }
    } catch (error: any) {
      console.error('Error updating balance:', error)
      throw error
    }
  }

  /**
   * Transfer between currencies
   */
  static async transfer(event: H3Event) {
    try {
      const body = await readBody(event)
      const { fromCurrency, toCurrency, amount } = body as WalletTransferRequest
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid transfer parameters' })
      }

      const wallet = await UserWalletModel.transfer(userId, fromCurrency as any, toCurrency as any, amount)

      return { success: true, data: wallet }
    } catch (error: any) {
      console.error('Error transferring funds:', error)
      throw error
    }
  }

  /**
   * Add extra wallet
   */
  static async addExtraWallet(event: H3Event) {
    try {
      const body = await readBody(event)
      const { symbol, address, balance } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      if (!symbol || !address) {
        throw createError({ statusCode: 400, statusMessage: 'Symbol and address are required' })
      }

      const wallet = await UserWalletModel.addExtraWallet(userId, symbol, address, balance || 0)

      return { success: true, data: wallet }
    } catch (error: any) {
      console.error('Error adding extra wallet:', error)
      throw error
    }
  }

  // ============================================================================
  // WALLET LOCK METHODS
  // ============================================================================

  /**
   * Lock wallet balance
   */
  static async lockWallet(event: H3Event) {
    try {
      const body = await readBody(event)
      const { currency, amount, reason, scheduledUnlock } = body as WalletLockRequest
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      if (!currency || !amount || amount <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Currency and amount are required' })
      }

      // Lock balance
      await UserWalletModel.lockBalance(userId, currency as any, amount, reason)

      return { success: true, message: 'Wallet balance locked' }
    } catch (error: any) {
      console.error('Error locking wallet:', error)
      throw error
    }
  }

  /**
   * Unlock wallet balance
   */
  static async unlockWallet(event: H3Event) {
    try {
      const supabase = await getSupabaseClient();
      const body = await readBody(event)
      const { lockId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      if (!lockId) {
        throw createError({ statusCode: 400, statusMessage: 'Lock ID is required' })
      }

      // Verify ownership
      const { data: lock, error: lockError } = await supabase
        .from('wallet_locks')
        .select('wallet_id')
        .eq('id', lockId)
        .single()

      if (lockError || !lock) {
        throw createError({ statusCode: 404, statusMessage: 'Lock not found' })
      }

      const wallet = await UserWalletModel.getById(lock.wallet_id)
      if (!wallet || wallet.user_id !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
      }

      // Unlock balance
      await UserWalletModel.unlockBalance(lockId)

      return { success: true, message: 'Wallet balance unlocked' }
    } catch (error: any) {
      console.error('Error unlocking wallet:', error)
      throw error
    }
  }

  /**
   * Get locked balances
   */
  static async getLockedBalances(event: H3Event) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const lockedBalances = await UserWalletModel.getLockedBalances(userId)

      return { success: true, data: lockedBalances }
    } catch (error: any) {
      console.error('Error getting locked balances:', error)
      throw error
    }
  }

  /**
   * Get wallet locks
   */
  static async getWalletLocks(event: H3Event) {
    try {
      const supabase = await getSupabaseClient();
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const wallet = await UserWalletModel.getByUserId(userId)
      if (!wallet) {
        throw createError({ statusCode: 404, statusMessage: 'Wallet not found' })
      }

      const { data: locks, error } = await supabase
        .from('wallet_locks')
        .select('*')
        .eq('wallet_id', wallet.id)
        .is('unlocked_at', null)
        .order('locked_at', { ascending: false })

      if (error) throw error

      return { success: true, data: locks || [] }
    } catch (error: any) {
      console.error('Error getting wallet locks:', error)
      throw error
    }
  }

  /**
   * Get wallet transactions
   */
  static async getTransactions(event: H3Event) {
    try {
      const supabase = await getSupabaseClient();
      const userId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const wallet = await UserWalletModel.getByUserId(userId)
      if (!wallet) {
        throw createError({ statusCode: 404, statusMessage: 'Wallet not found' })
      }

      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: transactions || [] }
    } catch (error: any) {
      console.error('Error getting transactions:', error)
      throw error
    }
  }
}
