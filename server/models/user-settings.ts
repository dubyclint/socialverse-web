// server/models/user-settings.ts
// User Settings Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  notifications_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  privacy_level: 'public' | 'friends' | 'private'
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UpdateSettingsInput {
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  notificationsEnabled?: boolean
  emailNotifications?: boolean
  pushNotifications?: boolean
  privacyLevel?: 'public' | 'friends' | 'private'
  twoFactorEnabled?: boolean
}

export class UserSettingsModel {
  static async getByUserId(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserSettings) || null
    } catch (error) {
      console.error('[UserSettingsModel] Get by user ID error:', error)
      throw error
    }
  }

  static async create(userId: string): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          theme: 'auto',
          language: 'en',
          notifications_enabled: true,
          email_notifications: true,
          push_notifications: true,
          privacy_level: 'public',
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Create error:', error)
      throw error
    }
  }

  static async update(userId: string, updates: UpdateSettingsInput): Promise<UserSettings> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.theme) updateData.theme = updates.theme
      if (updates.language) updateData.language = updates.language
      if (typeof updates.notificationsEnabled === 'boolean') updateData.notifications_enabled = updates.notificationsEnabled
      if (typeof updates.emailNotifications === 'boolean') updateData.email_notifications = updates.emailNotifications
      if (typeof updates.pushNotifications === 'boolean') updateData.push_notifications = updates.pushNotifications
      if (updates.privacyLevel) updateData.privacy_level = updates.privacyLevel
      if (typeof updates.twoFactorEnabled === 'boolean') updateData.two_factor_enabled = updates.twoFactorEnabled

      const { data, error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Update error:', error)
      throw error
    }
  }

  static async enableTwoFactor(userId: string): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Enable two factor error:', error)
      throw error
    }
  }

  static async disableTwoFactor(userId: string): Promise<UserSettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserSettings
    } catch (error) {
      console.error('[UserSettingsModel] Disable two factor error:', error)
      throw error
    }
  }
}

export default UserSettingsModel
