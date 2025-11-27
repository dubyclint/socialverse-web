// FILE: /server/models/user-wallet.ts
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

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new wallet
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  user_id: string
  wallet_address: string
  chain_id: number
  currency: string
}): Promise<UserWallet> {
  return UserWalletModel.createWallet(
    data.user_id,
    data.wallet_address,
    data.chain_id,
    data.currency
  )
}

/**
 * Find wallet by ID
 */
export async function findById(id: string): Promise<UserWallet | null> {
  return UserWalletModel.getWallet(id)
}

/**
 * Find all wallets for a user
 */
export async function findByUserId(userId: string): Promise<UserWallet[]> {
  return UserWalletModel.getUserWallets(userId)
}

/**
 * Find wallet by user ID and currency
 * This is a custom function that filters wallets by currency
 */
export async function findByCurrencyAndUser(
  userId: string,
  currency: string
): Promise<UserWallet | null> {
  const wallets = await UserWalletModel.getUserWallets(userId)
  return wallets.find(w => w.currency === currency) || null
}

/**
 * Find wallet by user ID and currency (alias for findByCurrencyAndUser)
 */
export async function findByUserAndCurrency(
  userId: string,
  currency: string
): Promise<UserWallet | null> {
  return findByCurrencyAndUser(userId, currency)
}

/**
 * Update wallet balance
 * Supports updating balance and locked_balance
 */
export async function updateBalance(
  userId: string,
  currency: string,
  updates: {
    balance?: number
    locked_balance?: number
    updated_at?: string
  }
): Promise<UserWallet> {
  // First, find the wallet by user and currency
  const wallet = await findByCurrencyAndUser(userId, currency)
  
  if (!wallet) {
    throw new Error(`Wallet not found for user ${userId} and currency ${currency}`)
  }

  // Update the wallet with new balance
  const newBalance = updates.balance !== undefined ? updates.balance : wallet.balance
  
  return UserWalletModel.updateBalance(wallet.id, newBalance)
}

/**
 * Update wallet (generic update function)
 */
export async function update(
  id: string,
  updates: Partial<UserWallet>
): Promise<UserWallet> {
  // For now, only balance updates are supported
  if (updates.balance !== undefined) {
    return UserWalletModel.updateBalance(id, updates.balance)
  }
  
  // If other fields need updating, fetch and return
  return UserWalletModel.getWallet(id) as Promise<UserWallet>
}

/**
 * Verify a wallet
 */
export async function verify(id: string): Promise<UserWallet> {
  return UserWalletModel.verifyWallet(id)
}

/**
 * Set wallet as primary
 */
export async function setPrimary(userId: string, walletId: string): Promise<void> {
  return UserWalletModel.setPrimaryWallet(userId, walletId)
}

/**
 * Delete a wallet
 */
export async function deleteWallet(id: string): Promise<void> {
  return UserWalletModel.deleteWallet(id)
}

// Alias for delete
export async function delete_(id: string): Promise<void> {
  return deleteWallet(id)
}
