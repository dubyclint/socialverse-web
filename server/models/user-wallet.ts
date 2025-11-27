// FILE: /server/models/user-wallet.ts
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
export interface UserWallet {
  id: string
  userId: string
  walletAddress: string
  chainId: number
  balance: number
  currency: string
  isVerified: boolean
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UserWalletModel {
  static async createWallet(
    userId: string,
    walletAddress: string,
    chainId: number,
    currency: string
  ): Promise<UserWallet> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          userId,
          walletAddress,
          chainId,
          balance: 0,
          currency,
          isVerified: false,
          isPrimary: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserWallet
    } catch (error) {
      console.error('[UserWalletModel] Error creating wallet:', error)
      throw error
    }
  }

  static async getWallet(id: string): Promise<UserWallet | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[UserWalletModel] Wallet not found')
        return null
      }

      return data as UserWallet
    } catch (error) {
      console.error('[UserWalletModel] Error fetching wallet:', error)
      throw error
    }
  }

  static async getUserWallets(userId: string): Promise<UserWallet[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('userId', userId)
        .order('isPrimary', { ascending: false })

      if (error) throw error
      return (data || []) as UserWallet[]
    } catch (error) {
      console.error('[UserWalletModel] Error fetching user wallets:', error)
      throw error
    }
  }

  static async updateBalance(id: string, balance: number): Promise<UserWallet> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_wallets')
        .update({
          balance,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as UserWallet
    } catch (error) {
      console.error('[UserWalletModel] Error updating balance:', error)
      throw error
    }
  }

  static async verifyWallet(id: string): Promise<UserWallet> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_wallets')
        .update({
          isVerified: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as UserWallet
    } catch (error) {
      console.error('[UserWalletModel] Error verifying wallet:', error)
      throw error
    }
  }

  static async setPrimaryWallet(userId: string, walletId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      
      // Unset all other primary wallets
      await supabase
        .from('user_wallets')
        .update({ isPrimary: false })
        .eq('userId', userId)

      // Set this wallet as primary
      const { error } = await supabase
        .from('user_wallets')
        .update({ isPrimary: true })
        .eq('id', walletId)

      if (error) throw error
    } catch (error) {
      console.error('[UserWalletModel] Error setting primary wallet:', error)
      throw error
    }
  }

  static async deleteWallet(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[UserWalletModel] Error deleting wallet:', error)
      throw error
    }
  }
}
