// server/models/profile.ts
// User Profile Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserProfile {
  id: string
  user_id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  cover_url?: string
  website?: string
  location?: string
  birth_date?: string
  gender?: string
  phone?: string
  email: string
  followers_count: number
  following_count: number
  posts_count: number
  is_verified: boolean
  is_private: boolean
  is_blocked: boolean
  rank: string
  rank_points: number
  rank_level: number
  created_at: string
  updated_at: string
  last_seen: string
}

export interface UpdateProfileInput {
  fullName?: string
  bio?: string
  avatarUrl?: string
  coverUrl?: string
  website?: string
  location?: string
  birthDate?: string
  gender?: string
  phone?: string
  isPrivate?: boolean
}

export class ProfileModel {
  static async getById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserProfile) || null
    } catch (error) {
      console.error('[ProfileModel] Get by ID error:', error)
      throw error
    }
  }

  static async getByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserProfile) || null
    } catch (error) {
      console.error('[ProfileModel] Get by username error:', error)
      throw error
    }
  }

  static async update(userId: string, updates: UpdateProfileInput): Promise<UserProfile> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (updates.fullName) updateData.full_name = updates.fullName
      if (updates.bio) updateData.bio = updates.bio
      if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl
      if (updates.coverUrl) updateData.cover_url = updates.coverUrl
      if (updates.website) updateData.website = updates.website
      if (updates.location) updateData.location = updates.location
      if (updates.birthDate) updateData.birth_date = updates.birthDate
      if (updates.gender) updateData.gender = updates.gender
      if (updates.phone) updateData.phone = updates.phone
      if (typeof updates.isPrivate === 'boolean') updateData.is_private = updates.isPrivate

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error('[ProfileModel] Update error:', error)
      throw error
    }
  }

  static async incrementFollowers(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('followers_count')
        .eq('id', userId)
        .single()

      await supabase
        .from('users')
        .update({ followers_count: (profile?.followers_count || 0) + 1 })
        .eq('id', userId)
    } catch (error) {
      console.error('[ProfileModel] Increment followers error:', error)
      throw error
    }
  }

  static async decrementFollowers(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('followers_count')
        .eq('id', userId)
        .single()

      await supabase
        .from('users')
        .update({ followers_count: Math.max(0, (profile?.followers_count || 1) - 1) })
        .eq('id', userId)
    } catch (error) {
      console.error('[ProfileModel] Decrement followers error:', error)
      throw error
    }
  }

  static async incrementFollowing(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('following_count')
        .eq('id', userId)
        .single()

      await supabase
        .from('users')
        .update({ following_count: (profile?.following_count || 0) + 1 })
        .eq('id', userId)
    } catch (error) {
      console.error('[ProfileModel] Increment following error:', error)
      throw error
    }
  }

  static async decrementFollowing(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('following_count')
        .eq('id', userId)
        .single()

      await supabase
        .from('users')
        .update({ following_count: Math.max(0, (profile?.following_count || 1) - 1) })
        .eq('id', userId)
    } catch (error) {
      console.error('[ProfileModel] Decrement following error:', error)
      throw error
    }
  }

  static async search(query: string, limit: number = 20): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .eq('is_private', false)
        .limit(limit)

      if (error) throw error
      return (data as UserProfile[]) || []
    } catch (error) {
      console.error('[ProfileModel] Search error:', error)
      throw error
    }
  }

  static async updateLastSeen(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('[ProfileModel] Update last seen error:', error)
      throw error
    }
  }
}

export default ProfileModel
