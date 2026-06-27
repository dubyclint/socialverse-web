// FILE: /server/models/escrow-trade.ts
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
export type EscrowStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

export interface EscrowTrade {
  id: string
  buyerId: string
  sellerId: string
  amount: number
  currency: string
  status: EscrowStatus
  description: string
  contractAddress?: string
  transactionHash?: string
  disputeReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class EscrowTradeModel {
  static async createTrade(
    buyerId: string,
    sellerId: string,
    amount: number,
    currency: string,
    description: string
  ): Promise<EscrowTrade> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('escrow_trades')
        .insert({
          buyerId,
          sellerId,
          amount,
          currency,
          description,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as EscrowTrade
    } catch (error) {
      console.error('[EscrowTradeModel] Error creating trade:', error)
      throw error
    }
  }

  static async getTrade(id: string): Promise<EscrowTrade | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('escrow_trades')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[EscrowTradeModel] Trade not found')
        return null
      }

      return data as EscrowTrade
    } catch (error) {
      console.error('[EscrowTradeModel] Error fetching trade:', error)
      throw error
    }
  }

  static async updateStatus(id: string, status: EscrowStatus, transactionHash?: string): Promise<EscrowTrade> {
    try {
      const supabase = await getSupabase()
      const updates: any = {
        status,
        updatedAt: new Date().toISOString()
      }

      if (transactionHash) {
        updates.transactionHash = transactionHash
      }

      if (status === 'COMPLETED') {
        updates.completedAt = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('escrow_trades')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as EscrowTrade
    } catch (error) {
      console.error('[EscrowTradeModel] Error updating status:', error)
      throw error
    }
  }

  static async getUserTrades(userId: string, role: 'buyer' | 'seller', limit = 50): Promise<EscrowTrade[]> {
    try {
      const supabase = await getSupabase()
      const field = role === 'buyer' ? 'buyerId' : 'sellerId'

      const { data, error } = await supabase
        .from('escrow_trades')
        .select('*')
        .eq(field, userId)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as EscrowTrade[]
    } catch (error) {
      console.error('[EscrowTradeModel] Error fetching user trades:', error)
      throw error
    }
  }

  static async raiseDispute(id: string, reason: string): Promise<EscrowTrade> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('escrow_trades')
        .update({
          status: 'DISPUTED',
          disputeReason: reason,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as EscrowTrade
    } catch (error) {
      console.error('[EscrowTradeModel] Error raising dispute:', error)
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
 * Create a new escrow trade
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  buyer_id: string
  seller_id: string
  trade_id?: string
  amount: number
  currency: string
  terms?: string
  auto_release_hours?: number
  description?: string
}): Promise<EscrowTrade> {
  return EscrowTradeModel.createTrade(
    data.buyer_id,
    data.seller_id,
    data.amount,
    data.currency,
    data.description || ''
  )
}

/**
 * Find escrow trade by ID
 */
export async function findById(id: string): Promise<EscrowTrade | null> {
  return EscrowTradeModel.getTrade(id)
}

/**
 * Update escrow trade
 */
export async function update(
  id: string,
  updates: Partial<EscrowTrade>
): Promise<EscrowTrade> {
  if (updates.status) {
    return EscrowTradeModel.updateStatus(
      id,
      updates.status as EscrowStatus,
      updates.transactionHash
    )
  }
  
  return EscrowTradeModel.getTrade(id) as Promise<EscrowTrade>
}

/**
 * Find escrow trades by buyer ID
 */
export async function findByBuyerId(buyerId: string): Promise<EscrowTrade[]> {
  return EscrowTradeModel.getUserTrades(buyerId, 'buyer')
}

/**
 * Find escrow trades by seller ID
 */
export async function findBySellerId(sellerId: string): Promise<EscrowTrade[]> {
  return EscrowTradeModel.getUserTrades(sellerId, 'seller')
}

/**
 * Release escrow funds
 */
export async function release(id: string): Promise<EscrowTrade> {
  return EscrowTradeModel.updateStatus(id, 'COMPLETED')
}

/**
 * Cancel escrow
 */
export async function cancel(id: string): Promise<EscrowTrade> {
  return EscrowTradeModel.updateStatus(id, 'CANCELLED')
}

/**
 * Raise dispute on escrow
 */
export async function raiseDispute(id: string, reason: string): Promise<EscrowTrade> {
  return EscrowTradeModel.raiseDispute(id, reason)
}
