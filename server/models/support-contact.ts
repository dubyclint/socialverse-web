import { supabase } from '~/server/db'

export interface SupportContact {
  id: string
  label: string
  value: string
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'other'
  region?: string
  updatedAt: string
  updatedBy?: string
}

export class SupportContactModel {
  static async create(contactData: Omit<SupportContact, 'id' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('support_contacts')
      .insert([
        {
          label: contactData.label,
          value: contactData.value,
          type: contactData.type,
          region: contactData.region,
          updated_at: new Date().toISOString(),
          updated_by: contactData.updatedBy
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as SupportContact
  }

  static async getByRegion(region?: string) {
    let query = supabase.from('support_contacts').select('*')

    if (region) {
      query = query.or(`region.eq.${region},region.is.null`)
    }

    const { data, error } = await query

    if (error) throw error
    return data as SupportContact[]
  }

  static async getByType(type: string) {
    const { data, error } = await supabase
      .from('support_contacts')
      .select('*')
      .eq('type', type)

    if (error) throw error
    return data as SupportContact[]
  }

  static async update(id: string, updates: Partial<SupportContact>, updatedBy?: string) {
    const { data, error } = await supabase
      .from('support_contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as SupportContact
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('support_contacts')
      .select('*')

    if (error) throw error
    return data as SupportContact[]
  }
}
