// FILE: /server/models/swap-transaction.ts
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
