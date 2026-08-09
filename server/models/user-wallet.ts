// Closed-loop credit wallet (1 PEW = $1.00 USD). The platform holds no crypto
// and no volatile fiat, so a wallet is a single per-user credit balance rather
// than a chain address.

import { getAdminClient } from '~/server/utils/supabase-server'

export const PEWGIFT_CURRENCY = 'PEW'

// `wallets` is keyed by user_id — that is also the wallet_ledger.wallet_id.
export interface UserWallet {
  user_id: string
  currency: string
  balance: number
  locked_balance: number
  is_locked: boolean
  updated_at: string
}

async function client() {
  return await getAdminClient()
}

export class UserWalletModel {
  /** Returns the user's credit wallet, creating it on first access. */
  static async ensure(userId: string): Promise<UserWallet> {
    const supabase = await client()
    const { data, error } = await supabase
      .from('wallets')
      .upsert({ user_id: userId, currency: PEWGIFT_CURRENCY }, { onConflict: 'user_id,currency', ignoreDuplicates: true })
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (data) return data as UserWallet

    return await UserWalletModel.getByUserId(userId) as UserWallet
  }

  static async getByUserId(userId: string): Promise<UserWallet | null> {
    const supabase = await client()
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', PEWGIFT_CURRENCY)
      .maybeSingle()

    if (error) throw error
    return (data as UserWallet) ?? null
  }


  /** Balance changes go through the money-core functions; this only toggles the lock. */
  static async setLocked(userId: string, isLocked: boolean): Promise<UserWallet> {
    const supabase = await client()
    const { data, error } = await supabase
      .from('wallets')
      .update({ is_locked: isLocked, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('currency', PEWGIFT_CURRENCY)
      .select('*')
      .single()

    if (error) throw error
    return data as UserWallet
  }

  static async getLedger(userId: string, limit = 50): Promise<unknown[]> {
    const supabase = await client()

    const { data, error } = await supabase
      .from('wallet_ledger')
      .select('*')
      .eq('wallet_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

export const ensure = UserWalletModel.ensure
export const findByUserId = UserWalletModel.getByUserId
export const setLocked = UserWalletModel.setLocked
