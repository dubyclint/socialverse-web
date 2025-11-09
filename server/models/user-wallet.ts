import { supabase } from '~/server/db'

export interface UserWallet {
  id: string
  userId: string
  balances: {
    usdt: number
    usdc: number
    btc: number
    eth: number
    sol: number
    matic: number
    xaut: number
  }
  extraWallets: Array<{
    symbol: string
    address: string
    balance: number
  }>
  createdAt: string
  updatedAt: string
}

export class UserWalletModel {
  static async create(userId: string, balances: any = {}) {
    const { data, error } = await supabase
      .from('user_wallets')
      .insert([
        {
          user_id: userId,
          balances: {
            usdt: balances.usdt || 0,
            usdc: balances.usdc || 0,
            btc: balances.btc || 0,
            eth: balances.eth || 0,
            sol: balances.sol || 0,
            matic: balances.matic || 0,
            xaut: balances.xaut || 0
          },
          extra_wallets: balances.extraWallets || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as UserWallet
  }

  static async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as UserWallet | null
  }

  static async updateBalances(userId: string, balances: any) {
    const { data, error } = await supabase
      .from('user_wallets')
      .update({
        balances,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as UserWallet
  }

  static async addExtraWallet(userId: string, wallet: { symbol: string; address: string; balance: number }) {
    const current = await this.getByUserId(userId)
    if (!current) throw new Error('Wallet not found')

    const { data, error } = await supabase
      .from('user_wallets')
      .update({
        extra_wallets: [...(current.extraWallets || []), wallet],
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as UserWallet
  }
}
