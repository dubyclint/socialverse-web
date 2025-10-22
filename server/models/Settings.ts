import { supabase } from '~/server/db'

export interface UserSetting {
  id: string
  userId: string
  key: string
  value: any
  updatedAt: string
}

export interface GlobalSetting {
  id: string
  key: string
  value: any
  updatedAt: string
  updatedBy: string
}

export class UserSettingModel {
  static async get(userId: string, key: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as UserSetting | null
  }

  static async set(userId: string, key: string, value: any) {
    const existing = await this.get(userId, key)

    if (existing) {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as UserSetting
    } else {
      const { data, error } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: userId,
            key,
            value,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data as UserSetting
    }
  }

  static async getUserSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data as UserSetting[]
  }
}

export class GlobalSettingModel {
  static async get(key: string) {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as GlobalSetting | null
  }

  static async set(key: string, value: any, updatedBy: string) {
    const existing = await this.get(key)

    if (existing) {
      const { data, error } = await supabase
        .from('global_settings')
        .update({
          value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as GlobalSetting
    } else {
      const { data, error } = await supabase
        .from('global_settings')
        .insert([
          {
            key,
            value,
            updated_at: new Date().toISOString(),
            updated_by: updatedBy
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data as GlobalSetting
    }
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')

    if (error) throw error
    return data as GlobalSetting[]
  }
}
