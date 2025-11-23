// server/models/escrow-trade.ts
// ============================================================================
// CONSOLIDATED ESCROW TRADE MODEL
// Merges: escrow.js + escrow-trade.ts
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export type EscrowStatus = 'pending' | 'locked' | 'released' | 'refunded' | 'disputed' | 'completed'

export interface LockCondition {
  type: string
  value: any
}

export interface ReleaseCondition {
  type: string
  value: any
}

export interface EscrowTrade {
  id: string
  trade_id: string
  buyer_id: string
  seller_id: string
  amount: number
  token: string
  holder_id: string
  status: EscrowStatus
  lock_conditions?: LockCondition[]
  release_conditions?: ReleaseCondition[]
  is_released: boolean
  is_refunded: boolean
  timestamp: string
  updated_at: string
}

export interface EscrowTransaction {
  id: string
  escrow_id: string
  transaction_type: 'lock' | 'release' | 'refund'
  amount: number
  timestamp: string
}

export class EscrowTradeModel {
  /**
   * Create a new escrow trade
   */
  static async create(tradeData: Partial<EscrowTrade>): Promise<EscrowTrade> {
    try {
      const { data, error } = await supabase
        .from('escrow_trades')
        .insert([
          {
            trade_id: tradeData.trade_id,
            buyer_id: tradeData.buyer_id,
            seller_id: tradeData.seller_id,
            amount: tradeData.amount,
            token: tradeData.token,
            holder_id: tradeData.holder_id,
            status: 'pending',
            lock_conditions: tradeData.lock_conditions || [],
            release_conditions: tradeData.release_conditions || [],
            is_released: false,
            is_refunded: false,
            timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error creating escrow trade:', error)
      throw error
    }
  }

  /**
   * Get escrow by trade ID
   */
  static async getByTradeId(tradeId: string): Promise<EscrowTrade | null> {
    try {
      const { data, error } = await supabase
        .from('escrow_trades')
        .select('*')
        .eq('trade_id', tradeId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting escrow by trade ID:', error)
      throw error
    }
  }

  /**
   * Get escrow by ID
   */
  static async getById(escrowId: string): Promise<EscrowTrade | null> {
    try {
      const { data, error } = await supabase
        .from('escrow_trades')
        .select('*')
        .eq('id', escrowId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error: any) {
      console.error('Error getting escrow:', error)
      throw error
    }
  }

  /**
   * Lock funds in escrow
   */
  static async lockFunds(escrowId: string, conditions: LockCondition[]): Promise<EscrowTrade> {
    try {
      const { data, error } = await supabase
        .from('escrow_trades')
        .update({
          status: 'locked',
          lock_conditions: conditions,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single()

      if (error) throw error

      // Record transaction
      await this.recordTransaction(escrowId, 'lock', data.amount)

      return data
    } catch (error: any) {
      console.error('Error locking funds:', error)
      throw error
    }
  }

  /**
   * Release funds from escrow
   */
  static async releaseFunds(escrowId: string): Promise<EscrowTrade> {
    try {
      const escrow = await this.getById(escrowId)
      if (!escrow) throw new Error('Escrow not found')

      const { data, error } = await supabase
        .from('escrow_trades')
        .update({
          status: 'released',
          is_released: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single()

      if (error) throw error

      // Record transaction
      await this.recordTransaction(escrowId, 'release', escrow.amount)

      return data
    } catch (error: any) {
      console.error('Error releasing funds:', error)
      throw error
    }
  }

  /**
   * Refund funds from escrow
   */
  static async refundFunds(escrowId: string): Promise<EscrowTrade> {
    try {
      const escrow = await this.getById(escrowId)
      if (!escrow) throw new Error('Escrow not found')

      const { data, error } = await supabase
        .from('escrow_trades')
        .update({
          status: 'refunded',
          is_refunded: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single()

      if (error) throw error

      // Record transaction
      await this.recordTransaction(escrowId, 'refund', escrow.amount)

      return data
    } catch (error: any) {
      console.error('Error refunding funds:', error)
      throw error
    }
  }

  /**
   * Dispute escrow
   */
  static async dispute(escrowId: string): Promise<EscrowTrade> {
    try {
      const { data, error } = await supabase
        .from('escrow_trades')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('Error disputing escrow:', error)
      throw error
    }
  }

  /**
   * Get escrow transactions
   */
  static async getTransactions(escrowId: string): Promise<EscrowTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('escrow_id', escrowId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting escrow transactions:', error)
      throw error
    }
  }

  /**
   * Record transaction
   */
  private static async recordTransaction(
    escrowId: string,
    transactionType: 'lock' | 'release' | 'refund',
    amount: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .insert({
          escrow_id: escrowId,
          transaction_type: transactionType,
          amount,
          timestamp: new Date().toISOString()
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Error recording transaction:', error)
    }
  }

  /**
   * Get user's escrows
   */
  static async getUserEscrows(userId: string, role: 'buyer' | 'seller' | 'holder'): Promise<EscrowTrade[]> {
    try {
      let query = supabase.from('escrow_trades').select('*')

      if (role === 'buyer') {
        query = query.eq('buyer_id', userId)
      } else if (role === 'seller') {
        query = query.eq('seller_id', userId)
      } else if (role === 'holder') {
        query = query.eq('holder_id', userId)
      }

      const { data, error } = await query.order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting user escrows:', error)
      throw error
    }
  }

  /**
   * Get escrows by status
   */
  static async getByStatus(status: EscrowStatus, limit: number = 50): Promise<EscrowTrade[]> {
    try {
      const { data, error } = await supabase
        .from('escrow_trades')
        .select('*')
        .eq('status', status)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting escrows by status:', error)
      throw error
    }
  }
}
