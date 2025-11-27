// FILE: /server/models/trade.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface Trade {
  id: string
  buyerId: string
  sellerId: string
  assetType: string
  assetId: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  paymentMethod: string
  shippingAddress?: string
  trackingNumber?: string
  createdAt: string
  completedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class TradeModel {
  static async createTrade(
    buyerId: string,
    sellerId: string,
    assetType: string,
    assetId: string,
    quantity: number,
    pricePerUnit: number,
    paymentMethod: string,
    shippingAddress?: string
  ): Promise<Trade> {
    try {
      const supabase = await getSupabase()
      const totalPrice = quantity * pricePerUnit

      const { data, error } = await supabase
        .from('trades')
        .insert({
          buyerId,
          sellerId,
          assetType,
          assetId,
          quantity,
          pricePerUnit,
          totalPrice,
          status: 'PENDING',
          paymentMethod,
          shippingAddress,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Error creating trade:', error)
      throw error
    }
  }

  static async getTrade(id: string): Promise<Trade | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[TradeModel] Trade not found')
        return null
      }

      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Error fetching trade:', error)
      throw error
    }
  }

  static async getUserTrades(userId: string, role: 'buyer' | 'seller', limit = 50): Promise<Trade[]> {
    try {
      const supabase = await getSupabase()
      const field = role === 'buyer' ? 'buyerId' : 'sellerId'

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq(field, userId)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Trade[]
    } catch (error) {
      console.error('[TradeModel] Error fetching user trades:', error)
      throw error
    }
  }

  static async updateTradeStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'): Promise<Trade> {
    try {
      const supabase = await getSupabase()
      const updates: any = { status }

      if (status === 'COMPLETED') {
        updates.completedAt = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Error updating trade status:', error)
      throw error
    }
  }

  static async addTrackingNumber(id: string, trackingNumber: string): Promise<Trade> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('trades')
        .update({ trackingNumber })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Trade
    } catch (error) {
      console.error('[TradeModel] Error adding tracking number:', error)
      throw error
    }
  }

  static async getPendingTrades(limit = 50): Promise<Trade[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('status', 'PENDING')
        .order('createdAt', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data || []) as Trade[]
    } catch (error) {
      console.error('[TradeModel] Error fetching pending trades:', error)
      throw error
    }
  }
}
