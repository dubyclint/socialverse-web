// server/models/trade.ts
// Trade Model - P2P trading

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type TradeStatus = 'pending' | 'accepted' | 'completed' | 'cancelled' | 'disputed'

export interface Trade {
  id: string
  seller_id: string
  buyer_id: string
  amount: number
  currency: string
  payment_method: string
  status: TradeStatus
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CreateTradeInput {
  sellerId: string
  buyerId: string
  amount: number
  currency: string
  paymentMethod: string
}

export class TradeModel {
  static async create(input: CreateTradeInput): Promise<Trade> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .insert({
          seller_id: input.sellerId,
          buyer_id: input.buyerId,
          amount: input.amount,
          currency: input.currency,
          payment_method: input.paymentMethod,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Create error:', error)
      throw error
    }
  }

  static async accept(tradeId: string): Promise<Trade> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Accept error:', error)
      throw error
    }
  }

  static async complete(tradeId: string): Promise<Trade> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Complete error:', error)
      throw error
    }
  }

  static async cancel(tradeId: string): Promise<Trade> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Cancel error:', error)
      throw error
    }
  }

  static async getUserTrades(userId: string, limit: number = 50): Promise<Trade[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Trade[]) || []
    } catch (error) {
      console.error('[TradeModel] Get user trades error:', error)
      throw error
    }
  }
}

export default TradeModel
