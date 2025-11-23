// server/models/profile-privacy-settings.ts
// ============================================================================
// CONSOLIDATED PROFILE PRIVACY SETTINGS MODEL
// Merges: profile-privacy.js + profile-privacy-settings.js
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PrivacySettings {
  show_profile_views: boolean
  show_online_status: boolean
  allow_messages: 'everyone' | 'pals-only' | 'nobody'
  allow_friend_requests: boolean
  show_last_seen: boolean
  show_activity_status: boolean
  allow_profile_search: boolean
  allow_location_sharing: boolean
  [key: string]: any
}

export interface ProfilePrivacyData {
  id: string
  userId: string
  privacySettings: PrivacySettings
  createdAt: string
  updatedAt: string
}

export class ProfilePrivacySettingsModel {
  /**
   * Get user's privacy settings
   */
  static async getSettings(userId: string): Promise<PrivacySettings> {
    try {
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      // If no settings exist, create default ones
      if (!data) {
        return await this.createDefaultSettings(userId)
      }

      return data.settings || this.getDefaultSettings()
    } catch (error: any) {
      console.error('Error getting privacy settings:', error)
      throw error
    }
  }

  /**
   * Create default privacy settings
   */
  static async createDefaultSettings(userId: string): Promise<PrivacySettings> {
    const defaultSettings = this.getDefaultSettings()

    try {
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .insert({
          user_id: userId,
          settings: defaultSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data.settings || defaultSettings
    } catch (error: any) {
      console.error('Error creating default privacy settings:', error)
      return defaultSettings
    }
  }

  /**
   * Get default privacy settings
   */
  static getDefaultSettings(): PrivacySettings {
    return {
      show_profile_views: true,
      show_online_status: true,
      allow_messages: 'everyone',
      allow_friend_requests: true,
      show_last_seen: true,
      show_activity_status: true,
      allow_profile_search: true,
      allow_location_sharing: false
    }
  }

  /**
   * Update privacy settings
   */
  static async updateSettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    try {
      const currentSettings = await this.getSettings(userId)
      const updatedSettings = { ...currentSettings, ...settings }

      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data.settings || updatedSettings
    } catch (error: any) {
      console.error('Error updating privacy settings:', error)
      throw error
    }
  }

  /**
   * Check if field is visible to viewer
   */
  static isFieldVisible(
    profile: any,
    fieldName: string,
    viewerId: string,
    privacySettings: PrivacySettings
  ): boolean {
    // Own profile - always visible
    if (profile.id === viewerId) return true

    const fieldVisibilityKey = `${fieldName}_visibility`
    const fieldVisibility = privacySettings[fieldVisibilityKey]

    // If no specific setting, default to visible
    if (fieldVisibility === undefined) return true

    // Check visibility level
    if (fieldVisibility === 'private') return false
    if (fieldVisibility === 'pals-only') {
      // Check if viewer is a pal
      return profile.pals?.includes(viewerId) || false
    }

    return true
  }

  /**
   * Get visible profile fields for viewer
   */
  static getVisibleFields(
    profile: any,
    viewerId: string,
    privacySettings: PrivacySettings
  ): Record<string, any> {
    const visibleFields: Record<string, any> = {}
    const publicFields = ['id', 'username', 'avatar_url', 'verified_badge']

    // Always include public fields
    publicFields.forEach(field => {
      if (profile[field] !== undefined) {
        visibleFields[field] = profile[field]
      }
    })

    // Check other fields based on privacy settings
    const allFields = Object.keys(profile)
    allFields.forEach(field => {
      if (!publicFields.includes(field)) {
        if (this.isFieldVisible(profile, field, viewerId, privacySettings)) {
          visibleFields[field] = profile[field]
        }
      }
    })

    return visibleFields
  }

  /**
   * Check if user allows messages from viewer
   */
  static canMessageUser(
    userId: string,
    viewerId: string,
    privacySettings: PrivacySettings,
    isPal: boolean = false
  ): boolean {
    if (userId === viewerId) return true

    const allowMessages = privacySettings.allow_messages

    if (allowMessages === 'nobody') return false
    if (allowMessages === 'pals-only') return isPal
    if (allowMessages === 'everyone') return true

    return false
  }

  /**
   * Check if user allows friend requests from viewer
   */
  static canSendFriendRequest(privacySettings: PrivacySettings): boolean {
    return privacySettings.allow_friend_requests !== false
  }

  /**
   * Bulk update privacy settings for multiple users
   */
  static async bulkUpdateSettings(
    userIds: string[],
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      const updates = userIds.map(userId => ({
        user_id: userId,
        settings,
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('profile_privacy_settings')
        .upsert(updates)

      if (error) throw error
    } catch (error: any) {
      console.error('Error bulk updating privacy settings:', error)
      throw error
    }
  }

  /**
   * Delete privacy settings (reset to defaults)
   */
  static async resetSettings(userId: string): Promise<PrivacySettings> {
    try {
      const defaultSettings = this.getDefaultSettings()

      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .update({
          settings: defaultSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data.settings || defaultSettings
    } catch (error: any) {
      console.error('Error resetting privacy settings:', error)
      throw error
    }
  }
}

