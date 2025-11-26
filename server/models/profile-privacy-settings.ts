// FILE: /server/models/profile-privacy-settings.ts
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
export interface ProfilePrivacySettings {
  id: string
  userId: string
  isProfilePublic: boolean
  allowMessages: 'EVERYONE' | 'FOLLOWERS' | 'NONE'
  allowComments: 'EVERYONE' | 'FOLLOWERS' | 'NONE'
  showFollowers: boolean
  showFollowing: boolean
  showActivity: boolean
  blockedUsers: string[]
  mutedUsers: string[]
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ProfilePrivacySettingsModel {
  static async getSettings(userId: string): Promise<ProfilePrivacySettings | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.warn('[ProfilePrivacySettingsModel] Settings not found')
        return null
      }

      return data as ProfilePrivacySettings
    } catch (error) {
      console.error('[ProfilePrivacySettingsModel] Error fetching settings:', error)
      throw error
    }
  }

  static async createSettings(userId: string): Promise<ProfilePrivacySettings> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .insert({
          userId,
          isProfilePublic: true,
          allowMessages: 'EVERYONE',
          allowComments: 'EVERYONE',
          showFollowers: true,
          showFollowing: true,
          showActivity: true,
          blockedUsers: [],
          mutedUsers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ProfilePrivacySettings
    } catch (error) {
      console.error('[ProfilePrivacySettingsModel] Error creating settings:', error)
      throw error
    }
  }

  static async updateSettings(userId: string, updates: Partial<ProfilePrivacySettings>): Promise<ProfilePrivacySettings> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single()

      if (error) throw error
      return data as ProfilePrivacySettings
    } catch (error) {
      console.error('[ProfilePrivacySettingsModel] Error updating settings:', error)
      throw error
    }
  }

  static async blockUser(userId: string, blockedUserId: string): Promise<ProfilePrivacySettings> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase.rpc('block_user', {
        user_id: userId,
        blocked_user_id: blockedUserId
      })

      if (error) throw error
      return data as ProfilePrivacySettings
    } catch (error) {
      console.error('[ProfilePrivacySettingsModel] Error blocking user:', error)
      throw error
    }
  }

  static async unblockUser(userId: string, blockedUserId: string): Promise<ProfilePrivacySettings> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase.rpc('unblock_user', {
        user_id: userId,
        blocked_user_id: blockedUserId
      })

      if (error) throw error
      return data as ProfilePrivacySettings
    } catch (error) {
      console.error('[ProfilePrivacySettingsModel] Error unblocking user:', error)
      throw error
    }
  }

  static async muteUser(userId: string, mutedUserId: string): Promise<ProfilePrivacySettings> {
    try {
      const supabase = await getSupabase()
      
      const { data, error } = await supabase.rpc('mute_user', {
        user_id: userId,
        muted_user_id: mutedUserId
      })

      if (error) throw error
      return data as ProfilePrivacySettings
    } catch (error) {
      console.error('[ProfilePrivacySettingsModel] Error muting user:', error)
      throw error
    }
  }
}
