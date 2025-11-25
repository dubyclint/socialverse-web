// server/models/p2p-profile.ts
// P2P Profile Model - Peer-to-peer trading profiles

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface P2PProfile {
  id: string
  user_id: string
  payment_methods: string[]
  trading_history_count: number
  completion_rate: number
  average_response_time: number
  is_verified_trader: boolean
  created_at: string
  updated_at: string
}

export class P2PProfileModel {
  static async getByUserId(userId: string): Promise<P2PProfile | null> {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as P2PProfile) || null
    } catch (error) {
      console.error('[P2PProfileModel] Get by user ID error:', error)
      throw error
    }
  }

  static async create(userId: string): Promise<P2PProfile> {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .insert({
          user_id: userId,
          payment_methods: [],
          trading_history_count: 0,
          completion_rate: 0,
          average_response_time: 0,
          is_verified_trader: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as P2PProfile
    } catch (error) {
      console.error('[P2PProfileModel] Create error:', error)
      throw error
    }
  }

  static async addPaymentMethod(userId: string, method: string): Promise<P2PProfile> {
    try {
      const profile = await this.getByUserId(userId)
      if (!profile) {
        return await this.create(userId)
      }

      const methods = [...profile.payment_methods, method]

      const { data, error } = await supabase
        .from('p2p_profiles')
        .update({
          payment_methods: methods,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as P2PProfile
    } catch (error) {
      console.error('[P2PProfileModel] Add payment method error:', error)
      throw error
    }
  }

  static async verifyTrader(userId: string): Promise<P2PProfile> {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .update({
          is_verified_trader: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as P2PProfile
    } catch (error) {
      console.error('[P2PProfileModel] Verify trader error:', error)
      throw error
    }
  }
}

export default P2PProfileModel
