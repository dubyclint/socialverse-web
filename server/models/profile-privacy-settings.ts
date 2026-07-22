import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

export type PrivacyAudience = 'EVERYONE' | 'FOLLOWERS' | 'NONE'

export interface ProfilePrivacySettings {
  id: string
  user_id: string
  is_profile_public: boolean
  allow_messages: PrivacyAudience
  allow_comments: PrivacyAudience
  show_followers: boolean
  show_following: boolean
  show_activity: boolean
  blocked_users: string[]
  muted_users: string[]
  created_at: string
  updated_at: string

  // compatibility aliases
  userId?: string
  isProfilePublic?: boolean
  allowMessages?: PrivacyAudience
  allowComments?: PrivacyAudience
  showFollowers?: boolean
  showFollowing?: boolean
  showActivity?: boolean
  blockedUsers?: string[]
  mutedUsers?: string[]
  createdAt?: string
  updatedAt?: string
}

const withAliases = (row: any): ProfilePrivacySettings => ({
  ...row,
  userId: row.user_id,
  isProfilePublic: row.is_profile_public,
  allowMessages: row.allow_messages,
  allowComments: row.allow_comments,
  showFollowers: row.show_followers,
  showFollowing: row.show_following,
  showActivity: row.show_activity,
  blockedUsers: row.blocked_users,
  mutedUsers: row.muted_users,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as Partial<T>
}

export class ProfilePrivacySettingsModel {
  static async getSettings(userId: string): Promise<ProfilePrivacySettings | null> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[ProfilePrivacySettingsModel.getSettings] error:', error.message)
      throw new Error('Failed to fetch privacy settings')
    }

    return data ? withAliases(data) : null
  }

  static async createSettings(userId: string): Promise<ProfilePrivacySettings> {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .insert({
        user_id: userId,
        is_profile_public: true,
        allow_messages: 'EVERYONE',
        allow_comments: 'EVERYONE',
        show_followers: true,
        show_following: true,
        show_activity: true,
        blocked_users: [],
        muted_users: [],
        created_at: now,
        updated_at: now
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('[ProfilePrivacySettingsModel.createSettings] error:', error?.message)
      throw new Error(error?.message || 'Failed to create privacy settings')
    }

    return withAliases(data)
  }

  static async updateSettings(
    userId: string,
    updates: Partial<ProfilePrivacySettings>
  ): Promise<ProfilePrivacySettings> {
    const supabase = getSupabase()

    const payload = stripUndefined({
      is_profile_public: updates.is_profile_public ?? updates.isProfilePublic,
      allow_messages: updates.allow_messages ?? updates.allowMessages,
      allow_comments: updates.allow_comments ?? updates.allowComments,
      show_followers: updates.show_followers ?? updates.showFollowers,
      show_following: updates.show_following ?? updates.showFollowing,
      show_activity: updates.show_activity ?? updates.showActivity,
      blocked_users: updates.blocked_users ?? updates.blockedUsers,
      muted_users: updates.muted_users ?? updates.mutedUsers,
      updated_at: new Date().toISOString()
    })

    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .update(payload)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[ProfilePrivacySettingsModel.updateSettings] error:', error?.message)
      throw new Error(error?.message || 'Failed to update privacy settings')
    }

    return withAliases(data)
  }

  static async blockUser(userId: string, blockedUserId: string): Promise<ProfilePrivacySettings | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('block_user', {
      user_id: userId,
      blocked_user_id: blockedUserId
    })

    if (error) {
      console.error('[ProfilePrivacySettingsModel.blockUser] error:', error.message)
      throw new Error('Failed to block user')
    }

    return data ? withAliases(data) : null
  }

  static async unblockUser(userId: string, blockedUserId: string): Promise<ProfilePrivacySettings | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('unblock_user', {
      user_id: userId,
      blocked_user_id: blockedUserId
    })

    if (error) {
      console.error('[ProfilePrivacySettingsModel.unblockUser] error:', error.message)
      throw new Error('Failed to unblock user')
    }

    return data ? withAliases(data) : null
  }

  static async muteUser(userId: string, mutedUserId: string): Promise<ProfilePrivacySettings | null> {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('mute_user', {
      user_id: userId,
      muted_user_id: mutedUserId
    })

    if (error) {
      console.error('[ProfilePrivacySettingsModel.muteUser] error:', error.message)
      throw new Error('Failed to mute user')
    }

    return data ? withAliases(data) : null
  }
}
