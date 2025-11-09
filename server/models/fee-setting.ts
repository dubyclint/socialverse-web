import { supabase } from '~/server/db'

export interface FeeSetting {
  id: string
  type: 'p2p' | 'match' | 'rankHide' | 'monetization'
  makerPercent?: number
  takerPercent?: number
  flatFee?: number
  userRevenueShare?: number
  updatedAt: string
  updatedBy?: string
}

export class FeeSettingModel {
  static async getByType(type: string) {
    const { data, error } = await supabase
      .from('fee_settings')
      .select('*')
      .eq('type', type)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as FeeSetting | null
  }

  static async update(type: string, updates: Partial<FeeSetting>, updatedBy?: string) {
    const { data, error } = await supabase
      .from('fee_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('type', type)
      .select()
      .single()

    if (error) throw error
    return data as FeeSetting
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('fee_settings')
      .select('*')

    if (error) throw error
    return data as FeeSetting[]
  }

  static async create(feeData: Omit<FeeSetting, 'id' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('fee_settings')
      .insert([
        {
          type: feeData.type,
          maker_percent: feeData.makerPercent,
          taker_percent: feeData.takerPercent,
          flat_fee: feeData.flatFee,
          user_revenue_share: feeData.userRevenueShare,
          updated_at: new Date().toISOString(),
          updated_by: feeData.updatedBy
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as FeeSetting
  }
}
