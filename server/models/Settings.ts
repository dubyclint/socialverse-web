// FILE: /server/models/Settings.ts
// REFACTORED: Lazy-loaded Supabase

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
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('key', key)
        .single()

      if (error) throw error
      return data as UserSetting
    } catch (error) {
      console.error('[UserSettingModel] Error:', error)
      throw error
    }
  }

  static async set(userId: string, key: string, value: any) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          key,
          value,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserSetting
    } catch (error) {
      console.error('[UserSettingModel] Error:', error)
      throw error
    }
  }

  static async getAll(userId: string) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      return (data || []) as UserSetting[]
    } catch (error) {
      console.error('[UserSettingModel] Error:', error)
      throw error
    }
  }
}

export class GlobalSettingModel {
  static async get(key: string) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .eq('key', key)
        .single()

      if (error) throw error
      return data as GlobalSetting
    } catch (error) {
      console.error('[GlobalSettingModel] Error:', error)
      throw error
    }
  }

  static async set(key: string, value: any, updatedBy: string) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('global_settings')
        .upsert({
          key,
          value,
          updatedAt: new Date().toISOString(),
          updatedBy
        })
        .select()
        .single()

      if (error) throw error
      return data as GlobalSetting
    } catch (error) {
      console.error('[GlobalSettingModel] Error:', error)
      throw error
    }
  }
}
