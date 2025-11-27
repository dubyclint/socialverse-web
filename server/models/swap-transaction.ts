// FILE: /server/models/swap-transaction.ts
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
export interface SwapTransaction {
  id: string
  userId: string
  fromToken: string
  toToken: string
  fromAmount: number
  toAmount: number
  exchangeRate: number
  fee: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  transactionHash?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class SwapTransactionModel {
  static async createSwap(
    userId: string,
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    exchangeRate: number,
    fee: number
  ): Promise<SwapTransaction> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('swap_transactions')
        .insert({
          userId,
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          exchangeRate,
          fee,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Error creating swap:', error)
      throw error
    }
  }

  static async getSwap(id: string): Promise<SwapTransaction | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('swap_transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[SwapTransactionModel] Swap not found')
        return null
      }

      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Error fetching swap:', error)
      throw error
    }
  }

  static async getUserSwaps(userId: string, limit = 50, offset = 0): Promise<SwapTransaction[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('swap_transactions')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as SwapTransaction[]
    } catch (error) {
      console.error('[SwapTransactionModel] Error fetching user swaps:', error)
      throw error
    }
  }

  static async completeSwap(id: string, transactionHash: string): Promise<SwapTransaction> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('swap_transactions')
        .update({
          status: 'COMPLETED',
          transactionHash,
          completedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Error completing swap:', error)
      throw error
    }
  }

  static async failSwap(id: string, errorMessage: string): Promise<SwapTransaction> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('swap_transactions')
        .update({
          status: 'FAILED',
          errorMessage,
          completedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Error failing swap:', error)
      throw error
    }
  }

  static async cancelSwap(id: string): Promise<SwapTransaction> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('swap_transactions')
        .update({
          status: 'CANCELLED',
          completedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SwapTransaction
    } catch (error) {
      console.error('[SwapTransactionModel] Error cancelling swap:', error)
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
 * Create a new swap transaction
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  user_id: string
  from_currency: string
  to_currency: string
  from_amount: number
  to_amount: number
  exchange_rate: number
  swap_type?: string
  slippage_tolerance?: number
  status?: string
  created_at?: string
}): Promise<SwapTransaction> {
  return SwapTransactionModel.createSwap(
    data.user_id,
    data.from_currency,
    data.to_currency,
    data.from_amount,
    data.to_amount,
    data.exchange_rate,
    0 // fee - can be calculated or passed separately
  )
}

/**
 * Find swap transaction by ID
 */
export async function findById(id: string): Promise<SwapTransaction | null> {
  return SwapTransactionModel.getSwap(id)
}

/**
 * Find all swap transactions for a user
 */
export async function findByUserId(
  userId: string,
  limit = 50,
  offset = 0,
  status?: string
): Promise<SwapTransaction[]> {
  const swaps = await SwapTransactionModel.getUserSwaps(userId, limit, offset)
  
  // Filter by status if provided
  if (status) {
    return swaps.filter(s => s.status === status.toUpperCase())
  }
  
  return swaps
}

/**
 * Update swap transaction
 * Supports updating status and other fields
 */
export async function update(
  id: string,
  updates: Partial<SwapTransaction>
): Promise<SwapTransaction> {
  const swap = await SwapTransactionModel.getSwap(id)
  
  if (!swap) {
    throw new Error(`Swap transaction not found: ${id}`)
  }

  // Handle different status updates
  if (updates.status) {
    const status = updates.status.toUpperCase()
    
    if (status === 'COMPLETED') {
      return SwapTransactionModel.completeSwap(
        id,
        updates.transactionHash || ''
      )
    } else if (status === 'FAILED') {
      return SwapTransactionModel.failSwap(
        id,
        updates.errorMessage || 'Unknown error'
      )
    } else if (status === 'CANCELLED') {
      return SwapTransactionModel.cancelSwap(id)
    }
  }

  // If no status update, return the current swap
  return swap
}

/**
 * Complete a swap transaction
 */
export async function complete(
  id: string,
  transactionHash: string
): Promise<SwapTransaction> {
  return SwapTransactionModel.completeSwap(id, transactionHash)
}

/**
 * Mark swap as failed
 */
export async function fail(
  id: string,
  errorMessage: string
): Promise<SwapTransaction> {
  return SwapTransactionModel.failSwap(id, errorMessage)
}

/**
 * Cancel a swap transaction
 */
export async function cancel(id: string): Promise<SwapTransaction> {
  return SwapTransactionModel.cancelSwap(id)
}
