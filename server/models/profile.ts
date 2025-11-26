// FILE: /server/models/profile.ts
// User Profile Model
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

  // ... rest of the methods follow the same pattern
}
