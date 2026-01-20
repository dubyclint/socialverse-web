// ============================================================================  
// FILE: /server/models/profile.ts - COMPLETE FIXED VERSION  
// ============================================================================  
// ✅ FIXED: Changed all 'user' table references to 'user_profiles'  
// ✅ FIXED: Changed all 'user_id' column references to 'id'  
// ✅ FIXED: Proper error handling and logging  
// ============================================================================  
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
  user_id?: string // Optional for backward compatibility  
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
      console.log('[ProfileModel] ============ GET PROFILE START ============')  
      console.log('[ProfileModel] Fetching profile for user:', userId)  
      const supabase = await getSupabase()  
        
      // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
      // ✅ FIXED: Changed from 'user_id' to 'id' column  
      const { data, error } = await supabase  
        .from('user_profiles')  
        .select('*')  
        .eq('id', userId)  
        .single()  
      if (error) {  
        console.error('[ProfileModel] ❌ Error fetching profile:', error.message)  
        console.log('[ProfileModel] ============ GET PROFILE END ============')  
        return null  
      }  
      if (!data) {  
        console.warn('[ProfileModel] ⚠️ No profile data returned')  
        console.log('[ProfileModel] ============ GET PROFILE END ============')  
        return null  
      }  
      console.log('[ProfileModel] ✅ Profile fetched successfully')  
      console.log('[ProfileModel] Profile data:', {  
        id: data.id,  
        username: data.username,  
        full_name: data.full_name  
      })  
      console.log('[ProfileModel] ============ GET PROFILE END ============')  
      return data as UserProfile  
    } catch (error) {  
      console.error('[ProfileModel] ❌ Exception in getProfile:', error)  
      throw error  
    }  
  }  
  static async createProfile(userId: string, data?: Partial<UserProfile>): Promise<UserProfile> {  
    try {  
      console.log('[ProfileModel] ============ CREATE PROFILE START ============')  
      console.log('[ProfileModel] Creating profile for user:', userId)  
      const supabase = await getSupabase()  
        
      // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
      // ✅ FIXED: Using 'id' column instead of 'user_id'  
      const { data: profile, error } = await supabase  
        .from('user_profiles')  
        .insert({  
          id: userId, // ✅ FIXED: Use 'id' instead of 'user_id'  
          username: data?.username || `user_${userId.substring(0, 8)}`,  
          email: data?.email || '',  
          full_name: data?.full_name || null,  
          bio: data?.bio || '',  
          avatar_url: data?.avatar_url || null,  
          cover_url: data?.cover_url || null,  
          website: data?.website || '',  
          location: data?.location || '',  
          birth_date: data?.birth_date || null,  
          gender: data?.gender || null,  
          phone: data?.phone || '',  
          followers_count: 0,  
          following_count: 0,  
          posts_count: 0,  
          is_verified: false,  
          is_private: false,  
          is_blocked: false,  
          rank: 'Bronze I',  
          rank_points: 0,  
          rank_level: 1,  
          created_at: new Date().toISOString(),  
          updated_at: new Date().toISOString(),  
          last_seen: new Date().toISOString(),  
          ...data  
        })  
        .select()  
        .single()  
      if (error) {  
        console.error('[ProfileModel] ❌ Error creating profile:', error.message)  
        throw error  
      }  
      if (!profile) {  
        console.error('[ProfileModel] ❌ No profile data returned after insert')  
        throw new Error('Profile creation failed - no data returned')  
      }  
      console.log('[ProfileModel] ✅ Profile created successfully')  
      console.log('[ProfileModel] Profile data:', {  
        id: profile.id,  
        username: profile.username,  
        email: profile.email  
      })  
      console.log('[ProfileModel] ============ CREATE PROFILE END ============')  
      return profile as UserProfile  
    } catch (error) {  
      console.error('[ProfileModel] ❌ Exception in createProfile:', error)  
      throw error  
    }  
  }  
  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {  
    try {  
      console.log('[ProfileModel] ============ UPDATE PROFILE START ============')  
      console.log('[ProfileModel] Updating profile for user:', userId)  
      console.log('[ProfileModel] Update data:', input)  
      const supabase = await getSupabase()  
        
      // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
      // ✅ FIXED: Changed from 'user_id' to 'id' column  
      const { data, error } = await supabase  
        .from('user_profiles')  
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
        .eq('id', userId) // ✅ FIXED: Changed from 'user_id' to 'id'  
        .select()  
        .single()  
      if (error) {  
        console.error('[ProfileModel] ❌ Error updating profile:', error.message)  
        throw error  
      }  
      if (!data) {  
        console.error('[ProfileModel] ❌ No profile data returned after update')  
        throw new Error('Profile update failed - no data returned')  
      }  
      console.log('[ProfileModel] ✅ Profile updated successfully')  
      console.log('[ProfileModel] ============ UPDATE PROFILE END ============')  
      return data as UserProfile  
    } catch (error) {  
      console.error('[ProfileModel] ❌ Exception in updateProfile:', error)  
      throw error  
    }  
  }  
  static async searchProfiles(query: string, limit = 20): Promise<UserProfile[]> {  
    try {  
      console.log('[ProfileModel] ============ SEARCH PROFILES START ============')  
      console.log('[ProfileModel] Searching profiles with query:', query)  
      console.log('[ProfileModel] Limit:', limit)  
      const supabase = await getSupabase()  
        
      // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
      const { data, error } = await supabase  
        .from('user_profiles')  
        .select('*')  
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)  
        .eq('is_blocked', false)  
        .limit(limit)  
      if (error) {  
        console.error('[ProfileModel] ❌ Error searching profiles:', error.message)  
        throw error  
      }  
      const results = (data || []) as UserProfile[]  
      console.log('[ProfileModel] ✅ Search completed, found:', results.length, 'profiles')  
      console.log('[ProfileModel] ============ SEARCH PROFILES END ============')  
      return results  
    } catch (error) {  
      console.error('[ProfileModel] ❌ Exception in searchProfiles:', error)  
      throw error  
    }  
  }  
  static async getTopProfiles(limit = 10): Promise<UserProfile[]> {  
    try {  
      console.log('[ProfileModel] ============ GET TOP PROFILES START ============')  
      console.log('[ProfileModel] Fetching top profiles, limit:', limit)  
      const supabase = await getSupabase()  
        
      // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
      const { data, error } = await supabase  
        .from('user_profiles')  
        .select('*')  
        .eq('is_verified', true)  
        .eq('is_blocked', false)  
        .order('followers_count', { ascending: false })  
        .limit(limit)  
      if (error) {  
        console.error('[ProfileModel] ❌ Error fetching top profiles:', error.message)  
        throw error  
      }  
      const results = (data || []) as UserProfile[]  
      console.log('[ProfileModel] ✅ Top profiles fetched, count:', results.length)  
      console.log('[ProfileModel] ============ GET TOP PROFILES END ============')  
      return results  
    } catch (error) {  
      console.error('[ProfileModel] ❌ Exception in getTopProfiles:', error)  
      throw error  
    }  
  }  
  static async updateLastSeen(userId: string): Promise<void> {  
    try {  
      console.log('[ProfileModel] ============ UPDATE LAST SEEN START ============')  
      console.log('[ProfileModel] Updating last seen for user:', userId)  
      const supabase = await getSupabase()  
        
      // ✅ FIXED: Changed from 'user' to 'user_profiles' table  
      // ✅ FIXED: Changed from 'user_id' to 'id' column  
      const { error } = await supabase  
        .from('user_profiles')  
        .update({ last_seen: new Date().toISOString() })  
        .eq('id', userId) // ✅ FIXED: Changed from 'user_id' to 'id'  
      if (error) {  
        console.error('[ProfileModel] ❌ Error updating last seen:', error.message)  
        throw error  
      }  
      console.log('[ProfileModel] ✅ Last seen updated successfully')  
      console.log('[ProfileModel] ============ UPDATE LAST SEEN END ============')  
    } catch (error) {  
      console.error('[ProfileModel] ❌ Exception in updateLastSeen:', error)  
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
  user_id?: string  
  id?: string  
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
  console.log('[Profile] ============ CREATE WRAPPER START ============')  
    
  // ✅ Support both 'id' and 'user_id' for backward compatibility  
  const userId = data.id || data.user_id  
    
  if (!userId) {  
    throw new Error('User ID is required')  
  }  
  console.log('[Profile] Creating profile with user ID:', userId)  
  console.log('[Profile] ============ CREATE WRAPPER END ============')  
    
  return ProfileModel.createProfile(userId, data)  
}  
/**  
 * Find profile by ID  
 */  
export async function findById(id: string): Promise<UserProfile | null> {  
  console.log('[Profile] Finding profile by ID:', id)  
  return ProfileModel.getProfile(id)  
}  
/**  
 * Update profile  
 */  
export async function update(  
  id: string,  
  updates: Partial<UserProfile>  
): Promise<UserProfile> {  
  console.log('[Profile] Updating profile:', id)  
    
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
  console.log('[Profile] Finding profile by user ID:', userId)  
  return ProfileModel.getProfile(userId)  
}  
/**  
 * Search profiles  
 */  
export async function search(query: string, limit = 20): Promise<UserProfile[]> {  
  console.log('[Profile] Searching profiles:', query)  
  return ProfileModel.searchProfiles(query, limit)  
}  
/**  
 * Get top profiles  
 */  
export async function getTop(limit = 10): Promise<UserProfile[]> {  
  console.log('[Profile] Getting top profiles, limit:', limit)  
  return ProfileModel.getTopProfiles(limit)  
}  
/**  
 * Update last seen  
 */  
export async function updateLastSeen(userId: string): Promise<void> {  
  console.log('[Profile] Updating last seen:', userId)  
  return ProfileModel.updateLastSeen(userId)  
}  

