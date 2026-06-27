// FILE: /server/models/user-settings.ts
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
export interface UserSettings {
  id: string
  userId: string
  theme: 'LIGHT' | 'DARK' | 'AUTO'
  language: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  twoFactorEnabled: boolean
  dataCollection: boolean
  marketingEmails: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UserSettingsModel {
  static async getSettings(userId: string): Promise<UserSettings | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.warn('[UserSettingsModel] Settings not found')
        return null
      }

      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Error fetching settings:', error)
      throw error
    }
  }

  static async createSettings(userId: string): Promise<UserSettings> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          userId,
          theme: 'AUTO',
          language: 'en',
          notificationsEnabled: true,
          emailNotifications: true,
          pushNotifications: true,
          twoFactorEnabled: false,
          dataCollection: true,
          marketingEmails: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Error creating settings:', error)
      throw error
    }
  }

  static async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Error updating settings:', error)
      throw error
    }
  }

  static async enableTwoFactor(userId: string): Promise<UserSettings> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          twoFactorEnabled: true,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Error enabling 2FA:', error)
      throw error
    }
  }

  static async disableTwoFactor(userId: string): Promise<UserSettings> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          twoFactorEnabled: false,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Error disabling 2FA:', error)
      throw error
    }
  }
}
