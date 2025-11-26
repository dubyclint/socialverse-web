// FILE: /server/models/Policy.ts
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
export interface Policy {
  id: string
  name: string
  description?: string
  feature: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT'
  rules: Record<string, any>
  targetCriteria?: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class PolicyModel {
  static async getPolicy(id: string): Promise<Policy | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[PolicyModel] Error fetching policy:', error)
        return null
      }

      return data as Policy
    } catch (error) {
      console.error('[PolicyModel] Exception:', error)
      throw error
    }
  }

  static async getPoliciesByFeature(feature: string): Promise<Policy[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('feature', feature)
        .eq('status', 'ACTIVE')
        .order('priority', { ascending: false })

      if (error) throw error
      return (data || []) as Policy[]
    } catch (error) {
      console.error('[PolicyModel] Error fetching policies:', error)
      throw error
    }
  }

  static async createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('policies')
        .insert({
          ...policy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Policy
    } catch (error) {
      console.error('[PolicyModel] Error creating policy:', error)
      throw error
    }
  }

  static async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('policies')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Policy
    } catch (error) {
      console.error('[PolicyModel] Error updating policy:', error)
      throw error
    }
  }

  static async deletePolicy(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[PolicyModel] Error deleting policy:', error)
      throw error
    }
  }
}
