// server/models/swap-transaction.ts
// Swap Transaction Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SwapStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface SwapTransaction {
  id: string
  user_id: string
  from_currency: string
  to_currency: string
  from_amount: number
  to_amount: number
  exchange_rate: number
  status: SwapStatus
  created_at: string
  updated_at: string
}

export interface CreateSwapInput {
  userId: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  exchangeRate: number
}

export class SwapTransactionModel {
  static async create(input: CreateSwapInput): Promise<SwapTransaction> {
    try {
      const { data, error } = await supabase
        .from('swap_transactions')
        .insert({
          user_id: input.userId,
          from_currency: input.fromCurrency,
          to_currency: input.toCurrency,
          from_amount: input.fromAmount,
          to_amount: input.toAmount,
          exchange_rate: input.exchangeRate,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Create error:', error)
      throw error
    }
  }

  static async complete(swapId: string): Promise<SwapTransaction> {
    try {
      const { data, error } = await supabase
        .from('swap_transactions')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', swapId)
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Complete error:', error)
      throw error
    }
  }

  static async fail(swapId: string): Promise<SwapTransaction> {
    try {
      const { data, error } = await supabase
        .from('swap_transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', swapId)
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Fail error:', error)
      throw error
    }
  }

  static async getUserSwaps(userId: string, limit: number = 50): Promise<SwapTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('swap_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as SwapTransaction[]) || []
    } catch (error) {
      console.error('[SwapTransactionModel] Get user swaps error:', error)
      throw error
    }
  }
}

export default SwapTransactionModel
