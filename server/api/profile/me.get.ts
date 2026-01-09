// ============================================================================
// FILE: /server/api/profile/me.get.ts - FINAL PRODUCTION VERSION
// ============================================================================
// ✅ Queries user_profiles table with admin client
// ✅ Falls back to JWT data if database fails
// ✅ Handles all error cases gracefully
// ============================================================================

import { getAdminClient } from '../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  console.log('[Profile/Me API] ============ GET PROFILE START ============')

  try {
    // ============================================================================
    // STEP 1: Get user from context (set by auth-header middleware)
    // ============================================================================
    console.log('[Profile/Me API] STEP 1: Checking authentication...')
    
    const user = event.context.user
    
    if (!user || !user.id) {
      console.error('[Profile/Me API] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
    console.log('[Profile/Me API] ✅ User found in context:', userId)
    console.log('[Profile/Me API] User email:', user.email)

    // ============================================================================
    // STEP 2: Fetch profile from database using admin client
    // ============================================================================
    console.log('[Profile/Me API] STEP 2: Fetching profile from database...')

    try {
      const supabase = await getAdminClient()

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('[Profile/Me API] ❌ Database error:', {
          message: profileError.message,
          code: profileError.code
        })

        // If profile not found, fall back to JWT data
        if (profileError.code === 'PGRST116') {
          console.log('[Profile/Me API] Profile not found in database, using JWT data')
          
          const jwtProfile = buildProfileFromJWT(user)
          console.log('[Profile/Me API] ✅ Returning profile from JWT')
          console.log('[Profile/Me API] ============ GET PROFILE END ============')
          
          return {
            success: true,
            data: jwtProfile
          }
        }

        // For other errors, also fall back to JWT
        console.warn('[Profile/Me API] ⚠️ Database query failed, falling back to JWT')
        const jwtProfile = buildProfileFromJWT(user)
        
        return {
          success: true,
          data: jwtProfile
        }
      }

      if (!profile) {
        console.warn('[Profile/Me API] ⚠️ Profile is null, using JWT data')
        const jwtProfile = buildProfileFromJWT(user)
        
        return {
          success: true,
          data: jwtProfile
        }
      }

      console.log('[Profile/Me API] ✅ Profile fetched from database successfully')
      console.log('[Profile/Me API] Profile username:', profile.username)
      console.log('[Profile/Me API] ============ GET PROFILE END ============')

      return {
        success: true,
        data: profile
      }

    } catch (dbError: any) {
      console.error('[Profile/Me API] ⚠️ Database access error:', dbError.message)
      console.log('[Profile/Me API] Falling back to JWT data')

      const jwtProfile = buildProfileFromJWT(user)
      
      return {
        success: true,
        data: jwtProfile
      }
    }

  } catch (error: any) {
    console.error('[Profile/Me API] ============ GET PROFILE ERROR ============')
    console.error('[Profile/Me API] Error:', error.message)
    console.error('[Profile/Me API] ============ END ERROR ============')

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch profile'
    })
  }
})

// ============================================================================
// HELPER FUNCTION: Build profile from JWT data
// ============================================================================
function buildProfileFromJWT(user: any) {
  return {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || 'user',
    full_name: user.user_metadata?.full_name || user.user_metadata?.username || 'User',
    bio: user.user_metadata?.bio || '',
    avatar_url: user.user_metadata?.avatar_url || null,
    cover_url: user.user_metadata?.cover_url || null,
    location: user.user_metadata?.location || '',
    website: user.user_metadata?.website || '',
    birth_date: user.user_metadata?.birth_date || null,
    gender: user.user_metadata?.gender || null,
    phone: user.user_metadata?.phone || '',
    is_private: user.user_metadata?.is_private || false,
    is_blocked: user.user_metadata?.is_blocked || false,
    is_verified: user.user_metadata?.is_verified || false,
    verification_status: user.user_metadata?.verification_status || 'unverified',
    rank: user.user_metadata?.rank || 'Bronze I',
    rank_points: user.user_metadata?.rank_points || 0,
    rank_level: user.user_metadata?.rank_level || 1,
    posts_count: user.user_metadata?.posts_count || 0,
    followers_count: user.user_metadata?.followers_count || 0,
    following_count: user.user_metadata?.following_count || 0,
    last_seen: user.user_metadata?.last_seen || new Date().toISOString(),
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString()
  }
}
