// server/models/user-wallet.ts
// ============================================================================
// CONSOLIDATED USER WALLET MODEL
// Merges: wallet.js + user-wallet.ts
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface WalletBalance {
  usdt: number
  usdc: number
  btc: number
  eth: number
  sol: number
  matic: number
  xaut: number
}

export interface ExtraWallet {
  symbol: string
  address: string
  balance: number
}

export interface UserWallet {
  id: string
  user_id: string
  balances: WalletBalance
  extra_wallets: ExtraWallet[]
  total_balance_usd: number
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  from_currency: string
  to_currency: string
  amount: number
  transaction_type: 'transfer' | 'deposit' | 'withdrawal' | 'swap'
  status: 'pending' | 'completed' | 'failed'
  timestamp: string
}

const SUPPORTED_CURRENCIES = [
  { code: 'USDT', name: 'Tether' },
  { code: 'USDC', name: 'USD Coin' },
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'SOL', name: 'Solana' },
  { code: 'MATIC', name: 'Polygon' },
  { code: 'XAUT', name: 'Tether Gold' }
]

export class UserWalletModel {
  /**
   * Create user wallets
   */
  static async create(userId: string, balances: Partial<WalletBalance> = {}): Promise<UserWallet> {
    try {
      const defaultBalances: WalletBalance = {
        usdt: balances.usdt || 0,
        usdc: balances.usdc || 0,
        btc: balances.btc || 0,
        eth: balances.eth || 0,
        sol: balances.sol || 0,
        matic: balances.matic || 0,
        xaut: balances.xaut || 0
      }

      const { data, error } = await supabase
        .from('user_wallets')
        .insert([
          {
            user_id: userId,
            balances: defaultBalances,
            extra_wallets: [],
            total_balance_usd: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating user wallet:', error)
      throw error
    }
  }

  /**
   * Get user wallet
   */
  static async getByUserId(userId: string): Promise<UserWallet | null> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting user wallet:', error)
      throw error
    }
  }

  /**
   * Get wallet by ID
   */
  static async getById(walletId: string): Promise<UserWallet | null> {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('id', walletId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting wallet:', error)
      throw error
    }
  }

  /**
   * Update wallet balance
   */
  static async updateBalance(
    userId: string,
    currency: keyof WalletBalance,
    amount: number
  ): Promise<UserWallet> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) throw new Error('Wallet not found')

      const updatedBalances = {
        ...wallet.balances,
        [currency]: Math.max(0, wallet.balances[currency] + amount)
      }

      const { data, error } = await supabase
        .from('user_wallets')
        .update({
          balances: updatedBalances,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error updating wallet balance:', error)
      throw error
    }
  }

  /**
   * Transfer between currencies
   */
  static async transfer(
    userId: string,
    fromCurrency: keyof WalletBalance,
    toCurrency: keyof WalletBalance,
    amount: number
  ): Promise<UserWallet> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) throw new Error('Wallet not found')

      if (wallet.balances[fromCurrency] < amount) {
        throw new Error('Insufficient balance')
      }

      const updatedBalances = {
        ...wallet.balances,
        [fromCurrency]: wallet.balances[fromCurrency] - amount,
        [toCurrency]: wallet.balances[toCurrency] + amount
      }

      const { data, error } = await supabase
        .from('user_wallets')
        .update({
          balances: updatedBalances,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error transferring funds:', error)
      throw error
    }
  }

  /**
   * Add extra wallet
   */
  static async addExtraWallet(
    userId: string,
    symbol: string,
    address: string,
    balance: number = 0
  ): Promise<UserWallet> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) throw new Error('Wallet not found')

      const extraWallets = [
        ...wallet.extra_wallets,
        { symbol, address, balance }
      ]

      const { data, error } = await supabase
        .from('user_wallets')
        .update({
          extra_wallets: extraWallets,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error adding extra wallet:', error)
      throw error
    }
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId: string, currency: keyof WalletBalance): Promise<number> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) return 0
      return wallet.balances[currency] || 0
    } catch (error: any) {
      console.error('Error getting wallet balance:', error)
      return 0
    }
  }

  /**
   * Get total balance in USD
   */
  static async getTotalBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) return 0
      return wallet.total_balance_usd || 0
    } catch (error: any) {
      console.error('Error getting total balance:', error)
      return 0
    }
  }

  /**
   * Lock wallet balance
   */
  static async lockBalance(
    userId: string,
    currency: keyof WalletBalance,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) throw new Error('Wallet not found')

      if (wallet.balances[currency] < amount) {
        throw new Error('Insufficient balance to lock')
      }

      // Create lock record
      const { error } = await supabase
        .from('wallet_locks')
        .insert({
          wallet_id: wallet.id,
          currency,
          amount,
          reason,
          locked_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Error locking wallet balance:', error)
      throw error
    }
  }

  /**
   * Unlock wallet balance
   */
  static async unlockBalance(lockId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('wallet_locks')
        .update({ unlocked_at: new Date().toISOString() })
        .eq('id', lockId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error unlocking wallet balance:', error)
      throw error
    }
  }

  /**
   * Get locked balances
   */
  static async getLockedBalances(userId: string): Promise<Record<string, number>> {
    try {
      const wallet = await this.getByUserId(userId)
      if (!wallet) return {}

      const { data, error } = await supabase
        .from('wallet_locks')
        .select('currency, amount')
        .eq('wallet_id', wallet.id)
        .is('unlocked_at', null)

      if (error) throw error

      const locked: Record<string, number> = {}
      ;(data || []).forEach(lock => {
        locked[lock.currency] = (locked[lock.currency] || 0) + lock.amount
      })

      return locked
    } catch (error: any) {
      console.error('Error getting locked balances:', error)
      return {}
    }
  }
}
