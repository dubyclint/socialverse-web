// FILE: /server/models/terms-and-policy.ts
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
export interface TermsAndPolicy {
  id: string
  type: 'TERMS' | 'PRIVACY' | 'COOKIE' | 'ACCEPTABLE_USE'
  version: number
  content: string
  effectiveDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  updatedBy: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class TermsAndPolicyModel {
  static async getPolicy(type: 'TERMS' | 'PRIVACY' | 'COOKIE' | 'ACCEPTABLE_USE'): Promise<TermsAndPolicy | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('terms_and_policies')
        .select('*')
        .eq('type', type)
        .eq('isActive', true)
        .single()

      if (error) {
        console.warn('[TermsAndPolicyModel] Policy not found')
        return null
      }

      return data as TermsAndPolicy
    } catch (error) {
      console.error('[TermsAndPolicyModel] Error fetching policy:', error)
      throw error
    }
  }

  static async createPolicy(
    type: 'TERMS' | 'PRIVACY' | 'COOKIE' | 'ACCEPTABLE_USE',
    content: string,
    effectiveDate: string,
    updatedBy: string
  ): Promise<TermsAndPolicy> {
    try {
      const supabase = await getSupabase()
      
      // Get current version
      const { data: existing } = await supabase
        .from('terms_and_policies')
        .select('version')
        .eq('type', type)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      const version = (existing?.version || 0) + 1

      const { data, error } = await supabase
        .from('terms_and_policies')
        .insert({
          type,
          version,
          content,
          effectiveDate,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy
        })
        .select()
        .single()

      if (error) throw error
      return data as TermsAndPolicy
    } catch (error) {
      console.error('[TermsAndPolicyModel] Error creating policy:', error)
      throw error
    }
  }

  static async getPolicyHistory(type: 'TERMS' | 'PRIVACY' | 'COOKIE' | 'ACCEPTABLE_USE'): Promise<TermsAndPolicy[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('terms_and_policies')
        .select('*')
        .eq('type', type)
        .order('version', { ascending: false })

      if (error) throw error
      return (data || []) as TermsAndPolicy[]
    } catch (error) {
      console.error('[TermsAndPolicyModel] Error fetching policy history:', error)
      throw error
    }
  }

  static async updatePolicy(
    type: 'TERMS' | 'PRIVACY' | 'COOKIE' | 'ACCEPTABLE_USE',
    content: string,
    effectiveDate: string,
    updatedBy: string
  ): Promise<TermsAndPolicy> {
    try {
      const supabase = await getSupabase()
      
      // Deactivate old policy
      await supabase
        .from('terms_and_policies')
        .update({ isActive: false })
        .eq('type', type)
        .eq('isActive', true)

      // Create new version
      return this.createPolicy(type, content, effectiveDate, updatedBy)
    } catch (error) {
      console.error('[TermsAndPolicyModel] Error updating policy:', error)
      throw error
    }
  }
}
