import { supabase } from '~/server/db'

export interface TermsAndPolicy {
  id: string
  feature: string
  content: string
  lastUpdated: string
  updatedBy: string
}

export class TermsAndPolicyModel {
  static async getByFeature(feature: string) {
    const { data, error } = await supabase
      .from('terms_and_policies')
      .select('*')
      .eq('feature', feature)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as TermsAndPolicy | null
  }

  static async update(feature: string, content: string, updatedBy: string) {
    const existing = await this.getByFeature(feature)

    if (existing) {
      const { data, error } = await supabase
        .from('terms_and_policies')
        .update({
          content,
          last_updated: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as TermsAndPolicy
    } else {
      const { data, error } = await supabase
        .from('terms_and_policies')
        .insert([
          {
            feature,
            content,
            last_updated: new Date().toISOString(),
            updated_by: updatedBy
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data as TermsAndPolicy
    }
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('terms_and_policies')
      .select('*')

    if (error) throw error
    return data as TermsAndPolicy[]
  }
}
