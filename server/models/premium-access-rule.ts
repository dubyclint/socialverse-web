import { supabase } from '~/server/db'

export interface premium-accessRule {
  id: string
  target: 'country' | 'region' | 'geo' | 'all'
  value: string
  features: {
    p2p?: boolean
    matching?: boolean
    rankHide?: boolean
  }
  active: boolean
  createdAt: string
  updatedAt: string
}

export class PremiumAccessRuleModel {
  static async create(ruleData: Omit<PremiumAccessRule, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('premium_access_rules')
      .insert([
        {
          target: ruleData.target,
          value: ruleData.value,
          features: ruleData.features,
          active: ruleData.active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as PremiumAccessRule
  }

  static async getByTarget(target: string, value?: string) {
    let query = supabase
      .from('premium_access_rules')
      .select('*')
      .eq('target', target)
      .eq('active', true)

    if (value) {
      query = query.eq('value', value)
    }

    const { data, error } = await query

    if (error) throw error
    return data as PremiumAccessRule[]
  }

  static async update(id: string, updates: Partial<PremiumAccessRule>) {
    const { data, error } = await supabase
      .from('premium_access_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as PremiumAccessRule
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('premium_access_rules')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('premium_access_rules')
      .select('*')

    if (error) throw error
    return data as PremiumAccessRule[]
  }
}
