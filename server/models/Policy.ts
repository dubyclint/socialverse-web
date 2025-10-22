import { supabase } from '~/server/db'

export interface Policy {
  id: string
  name: string
  description?: string
  feature: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  rules: Record<string, any>
  targetCriteria?: Record<string, any>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export class PolicyModel {
  static async create(policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('policies')
      .insert([
        {
          name: policyData.name,
          description: policyData.description,
          feature: policyData.feature,
          priority: policyData.priority || 'MEDIUM',
          status: policyData.status || 'DRAFT',
          rules: policyData.rules,
          target_criteria: policyData.targetCriteria,
          created_by: policyData.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as Policy
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as Policy | null
  }

  static async getByFeature(feature: string) {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('feature', feature)
      .eq('status', 'ACTIVE')

    if (error) throw error
    return data as Policy[]
  }

  static async update(id: string, updates: Partial<Policy>) {
    const { data, error } = await supabase
      .from('policies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Policy
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('policies')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getAll(limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as Policy[]
  }
}
