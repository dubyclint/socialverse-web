// FILE: /server/models/profile.ts
// User Profile Model
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

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

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ProfileModel {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[ProfileModel] Error fetching profile:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('[ProfileModel] Exception:', error)
      throw error
    }
  }

  static async createProfile(userId: string, data?: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const supabase = await getSupabase()
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: data?.username || `user_${userId.substring(0, 8)}`,
          email: data?.email || '',
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          is_verified: false,
          is_private: false,
          is_blocked: false,
          rank: 'BRONZE',
          rank_points: 0,
          rank_level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          ...data
        })
        .select()
        .single()

      if (error) throw error
      return profile as UserProfile
    } catch (error) {
      console.error('[ProfileModel] Error creating profile:', error)
      throw error
    }
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: input.fullName,
          bio: input.bio,
          avatar_url: input.avatarUrl,
          cover_url: input.coverUrl,
          website: input.website,
          location: input.location,
          birth_date: input.birthDate,
          gender: input.gender,
          phone: input.phone,
          is_private: input.isPrivate,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error('[ProfileModel] Error updating profile:', error)
      throw error
    }
  }

  static async searchProfiles(query: string, limit = 20): Promise<UserProfile[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .eq('is_blocked', false)
        .limit(limit)

      if (error) throw error
      return (data || []) as UserProfile[]
    } catch (error) {
      console.error('[ProfileModel] Error searching profiles:', error)
      throw error
    }
  }

  static async getTopProfiles(limit = 10): Promise<UserProfile[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', true)
        .eq('is_blocked', false)
        .order('followers_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as UserProfile[]
    } catch (error) {
      console.error('[ProfileModel] Error fetching top profiles:', error)
      throw error
    }
  }

  static async updateLastSeen(userId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('[ProfileModel] Error updating last seen:', error)
      throw error
    }
  }
}

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new profile
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  user_id: string
  username?: string
  full_name?: string
  bio?: string
  avatar_url?: string
  cover_url?: string
  website?: string
  location?: string
  birth_date?: string
  gender?: string
  phone?: string
}): Promise<UserProfile> {
  return ProfileModel.createProfile(data.user_id, data)
}

/**
 * Find profile by ID
 */
export async function findById(id: string): Promise<UserProfile | null> {
  return ProfileModel.getProfile(id)
}

/**
 * Update profile
 */
export async function update(
  id: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const input: UpdateProfileInput = {
    fullName: updates.full_name,
    bio: updates.bio,
    avatarUrl: updates.avatar_url,
    coverUrl: updates.cover_url,
    website: updates.website,
    location: updates.location,
    birthDate: updates.birth_date,
    gender: updates.gender,
    phone: updates.phone,
    isPrivate: updates.is_private
  }
  
  return ProfileModel.updateProfile(id, input)
}

/**
 * Find profile by user ID
 */
export async function findByUserId(userId: string): Promise<UserProfile | null> {
  return ProfileModel.getProfile(userId)
}

/**
 * Search profiles
 */
export async function search(query: string, limit = 20): Promise<UserProfile[]> {
  return ProfileModel.searchProfiles(query, limit)
}

/**
 * Get top profiles
 */
export async function getTop(limit = 10): Promise<UserProfile[]> {
  return ProfileModel.getTopProfiles(limit)
}

/**
 * Update last seen
 */
export async function updateLastSeen(userId: string): Promise<void> {
  return ProfileModel.updateLastSeen(userId)
}
