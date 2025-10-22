import { supabase } from '~/server/db'

export interface EscrowTrade {
  id: string
  buyerId: string
  sellerId: string
  amount: number
  token: string
  tradeId: string
  isReleased: boolean
  isRefunded: boolean
  timestamp: string
  updatedAt: string
}

export class EscrowTradeModel {
  static async create(tradeData: Omit<EscrowTrade, 'id' | 'timestamp' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('escrow_trades')
      .insert([
        {
          buyer_id: tradeData.buyerId,
          seller_id: tradeData.sellerId,
          amount: tradeData.amount,
          token: tradeData.token,
          trade_id: tradeData.tradeId,
          is_released: false,
          is_refunded: false,
          timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as EscrowTrade
  }

  static async getByTradeId(tradeId: string) {
    const { data, error } = await supabase
      .from('escrow_trades')
      .select('*')
      .eq('trade_id', tradeId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as EscrowTrade | null
  }

  static async releaseFunds(tradeId: string) {
    const { data, error } = await supabase
      .from('escrow_trades')
      .update({
        is_released: true,
        updated_at: new Date().toISOString()
      })
      .eq('trade_id', tradeId)
      .select()
      .single()

    if (error) throw error
    return data as EscrowTrade
  }

  static async refundFunds(tradeId: string) {
    const { data, error } = await supabase
      .from('escrow_trades')
      .update({
        is_refunded: true,
        updated_at: new Date().toISOString()
      })
      .eq('trade_id', tradeId)
      .select()
      .single()

    if (error) throw error
    return data as EscrowTrade
  }

  static async getUserTrades(userId: string) {
    const { data, error } = await supabase
      .from('escrow_trades')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data as EscrowTrade[]
  }
}
