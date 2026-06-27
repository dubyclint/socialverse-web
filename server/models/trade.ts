// FILE: /server/models/trade.ts
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

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

  static async updateStatus(id: string, status: string): Promise<Trade> {
    try {
      const supabase = await getSupabase()
      const updates: any = {
        status,
        updatedAt: new Date().toISOString()
      }

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
      console.error('[TradeModel] Error updating status:', error)
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

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new trade
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  user_id: string
  trade_type?: string
  currency_from?: string
  currency_to?: string
  amount_from?: number
  amount_to?: number
  exchange_rate?: number
  description?: string
  payment_methods?: string[]
  min_amount?: number
  max_amount?: number
  buyer_id?: string
  seller_id?: string
  asset_type?: string
  asset_id?: string
  quantity?: number
  price_per_unit?: number
  payment_method?: string
  shipping_address?: string
}): Promise<Trade> {
  return TradeModel.createTrade(
    data.buyer_id || data.user_id,
    data.seller_id || data.user_id,
    data.asset_type || 'CURRENCY',
    data.asset_id || data.currency_from || '',
    data.quantity || 1,
    data.price_per_unit || data.exchange_rate || 1,
    data.payment_method || 'WALLET',
    data.shipping_address
  )
}

/**
 * Find trade by ID
 */
export async function findById(id: string): Promise<Trade | null> {
  return TradeModel.getTrade(id)
}

/**
 * Update trade
 */
export async function update(
  id: string,
  updates: Partial<Trade>
): Promise<Trade> {
  if (updates.status) {
    return TradeModel.updateStatus(id, updates.status)
  }
  
  return TradeModel.getTrade(id) as Promise<Trade>
}

/**
 * Find trades by user ID
 */
export async function findByUserId(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Trade[]> {
  return TradeModel.getUserTrades(userId, 'buyer', limit)
}

/**
 * Close trade
 */
export async function close(id: string): Promise<Trade> {
  return TradeModel.updateStatus(id, 'COMPLETED')
}

/**
 * Get pending trades
 */
export async function getPending(limit = 50): Promise<Trade[]> {
  return TradeModel.getPendingTrades(limit)
}
