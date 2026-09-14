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

// ============================================================================
// TYPE INTERFACES
// ============================================================================
export interface UserProfile {
  user_id: string          // Canonical primary key in 'user' table
  id?: string              // Explicit alias for compatibility workflows
  username: string
  email: string | null
  display_name: string | null  // Reconciled database column
  full_name?: string | null    // Kept as an optional layout safety alias
  bio: string | null
  avatar_url: string | null
  cover_url?: string | null
  website: string | null
  location: string | null
  birth_date?: string | null
  gender?: string | null
  phone?: string | null
  profile_completed?: boolean
  is_verified: boolean
  is_private: boolean
  is_blocked?: boolean
  rank?: string
  rank_points?: number
  rank_level?: number
  followers_count?: number
  following_count?: number
  posts_count?: number
  created_at?: string
  updated_at?: string | null
  last_seen?: string | null
}

export interface CreateProfileInput {
  id?: string
  user_id?: string
  username?: string
  email?: string | null
  full_name?: string | null  // Maps incoming data from layout UI components
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  cover_url?: string | null
  website?: string | null
  location?: string | null
  birth_date?: string | null
  gender?: string | null
  phone?: string | null
  is_private?: boolean
}

export interface UpdateProfileInput {
  username?: string
  full_name?: string | null // Maps incoming data from layout UI components
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  cover_url?: string | null
  website?: string | null
  location?: string | null
  birth_date?: string | null
  gender?: string | null
  phone?: string | null
  is_private?: boolean
  profile_completed?: boolean
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================
const withAlias = (row: any): UserProfile => {
  if (!row) return row
  // Generates cross-compatible structural alignment maps for both frontend/backend layers
  return { 
    ...row, 
    id: row.user_id, 
    full_name: row.display_name 
  }
}

const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as Partial<T>
}

// ============================================================================
// MODEL DEFINITIONS
// ============================================================================
export class ProfileModel {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[ProfileModel.getProfile] error:', error.message)
      return null
    }

    return data ? withAlias(data) : null
  }

  static async createProfile(userId: string, input: Partial<CreateProfileInput> = {}): Promise<UserProfile> {
    const supabase = getSupabase()
    const now = new Date().toISOString()
    
    const payload = {
      user_id: userId,
      username: input.username || `user_${String(userId).slice(0, 8)}`,
      email: input.email ?? null,
      display_name: input.display_name ?? input.full_name ?? null,
      bio: input.bio ?? null,
      avatar_url: input.avatar_url ?? null,
      cover_url: input.cover_url ?? null,
      website: input.website ?? null,
      location: input.location ?? null,
      birth_date: input.birth_date ?? null,
      gender: input.gender ?? null,
      phone: input.phone ?? null,
      profile_completed: false,
      is_verified: false,
      is_private: input.is_private ?? false,
      is_blocked: false,
      rank: 'Bronze I',
      rank_points: 0,
      rank_level: 1,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      created_at: now,
      updated_at: now,
      last_seen: now
    }

    const { data, error } = await supabase
      .from('user')
      .insert(payload)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[ProfileModel.createProfile] error:', error?.message)
      throw new Error(error?.message || 'Failed to create profile')
    }

    return withAlias(data)
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const supabase = getSupabase()

    const updatePayload = stripUndefined({
      username: input.username,
      display_name: input.display_name ?? input.full_name,
      bio: input.bio,
      avatar_url: input.avatar_url,
      cover_url: input.cover_url,
      website: input.website,
      location: input.location,
      birth_date: input.birth_date,
      gender: input.gender,
      phone: input.phone,
      is_private: input.is_private,
      profile_completed: input.profile_completed,
      updated_at: new Date().toISOString()
    })

    const { data, error } = await supabase
      .from('user')
      .update(updatePayload)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[ProfileModel.updateProfile] error:', error?.message)
      throw new Error(error?.message || 'Failed to update profile')
    }

    return withAlias(data)
  }

  static async searchProfiles(query: string, limit = 20): Promise<UserProfile[]> {
    const supabase = getSupabase()
    const q = (query || '').trim()
    if (!q) return []

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .eq('is_blocked', false)
      .limit(limit)

    if (error) {
      console.error('[ProfileModel.searchProfiles] error:', error.message)
      throw new Error('Failed to search profiles')
    }

    return (data || []).map(withAlias)
  }

  static async getTopProfiles(limit = 10): Promise<UserProfile[]> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('is_verified', true)
      .eq('is_blocked', false)
      .order('followers_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[ProfileModel.getTopProfiles] error:', error.message)
      throw new Error('Failed to get top profiles')
    }

    return (data || []).map(withAlias)
  }

  static async updateLastSeen(userId: string): Promise<void> {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('user')
      .update({ last_seen: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      console.error('[ProfileModel.updateLastSeen] error:', error.message)
      throw new Error('Failed to update last_seen')
    }
  }
}

// ============================================================================
// COMPATIBILITY BACKWARDS-EXPORT WRAPPERS
// ============================================================================
export async function create(data: CreateProfileInput): Promise<UserProfile> {
  const userId = data.user_id || data.id
  if (!userId) throw new Error('User ID is required')
  return ProfileModel.createProfile(userId, data)
}

export async function findById(id: string): Promise<UserProfile | null> {
  return ProfileModel.getProfile(id)
}

export async function update(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  return ProfileModel.updateProfile(id, {
    username: updates.username,
    full_name: updates.full_name ?? updates.display_name,
    bio: updates.bio,
    avatar_url: updates.avatar_url,
    cover_url: updates.cover_url,
    website: updates.website,
    location: updates.location,
    birth_date: updates.birth_date,
    gender: updates.gender,
    phone: updates.phone,
    is_private: updates.is_private,
    profile_completed: updates.profile_completed
  })
}

export async function findByUserId(userId: string): Promise<UserProfile | null> {
  return ProfileModel.getProfile(userId)
}

export async function search(query: string, limit = 20): Promise<UserProfile[]> {
  return ProfileModel.searchProfiles(query, limit)
}

export async function getTop(limit = 10): Promise<UserProfile[]> {
  return ProfileModel.getTopProfiles(limit)
}

export async function updateLastSeen(userId: string): Promise<void> {
  return ProfileModel.updateLastSeen(userId)
}
