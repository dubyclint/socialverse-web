// FILE: /server/models/fee-setting.ts
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
export interface FeeSetting {
  id: string
  name: string
  description?: string
  feeType: 'PERCENTAGE' | 'FIXED' | 'TIERED'
  value: number
  minAmount?: number
  maxAmount?: number
  currency: string
  isActive: boolean
  appliesTo: string[]
  createdAt: string
  updatedAt: string
  updatedBy: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class FeeSettingModel {
  static async getFeeSetting(id: string): Promise<FeeSetting | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('fee_settings')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[FeeSettingModel] Fee setting not found')
        return null
      }

      return data as FeeSetting
    } catch (error) {
      console.error('[FeeSettingModel] Error fetching fee setting:', error)
      throw error
    }
  }

  static async getActiveFeeSettings(): Promise<FeeSetting[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('fee_settings')
        .select('*')
        .eq('isActive', true)

      if (error) throw error
      return (data || []) as FeeSetting[]
    } catch (error) {
      console.error('[FeeSettingModel] Error fetching active fee settings:', error)
      throw error
    }
  }

  static async createFeeSetting(setting: Omit<FeeSetting, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeeSetting> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('fee_settings')
        .insert({
          ...setting,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as FeeSetting
    } catch (error) {
      console.error('[FeeSettingModel] Error creating fee setting:', error)
      throw error
    }
  }

  static async updateFeeSetting(id: string, updates: Partial<FeeSetting>): Promise<FeeSetting> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('fee_settings')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as FeeSetting
    } catch (error) {
      console.error('[FeeSettingModel] Error updating fee setting:', error)
      throw error
    }
  }

  static async calculateFee(amount: number, applicableType: string): Promise<number> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .rpc('calculate_fee', {
          amount,
          applicable_type: applicableType
        })

      if (error) throw error
      return data || 0
    } catch (error) {
      console.error('[FeeSettingModel] Error calculating fee:', error)
      throw error
    }
  }
}
