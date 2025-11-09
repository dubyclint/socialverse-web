import { supabase } from '~/server/db'

export interface UserOverride {
  id: string
  userId: string
  overrideType: 'premium' | 'fee' | 'monetization' | 'tier' | 'trust'
  key: string
  value: any
  reason?: string
  createdAt: string
  updatedAt: string
  adminId: string
}

export class UserOverrideModel {
  static async create(overrideData: Omit<UserOverride, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('user_overrides')
      .insert([
        {
          user_id: overrideData.userId,
          override_type: overrideData.overrideType,
          key: overrideData.key,
          value: overrideData.value,
          reason: overrideData.reason,
          admin_id: overrideData.adminId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data as UserOverride
  }

  static async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user_overrides')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data as UserOverride[]
  }

  static async getByUserAndType(userId: string, overrideType: string) {
    const { data, error } = await supabase
      .from('user_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('override_type', overrideType)

    if (error) throw error
    return data as UserOverride[]
  }

  static async update(id: string, updates: Partial<UserOverride>) {
    const { data, error } = await supabase
      .from('user_overrides')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as UserOverride
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('user_overrides')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
