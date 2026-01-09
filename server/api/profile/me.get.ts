// ============================================================================
// FILE: /server/api/profile/me.get.ts - FIXED VERSION
// ============================================================================
// ✅ FIXED: Uses admin client to query user_profiles table
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
    // STEP 2: Fetch complete profile from user_profiles table using ADMIN client
    // ============================================================================
    console.log('[Profile/Me API] STEP 2: Fetching profile from database...')

    const supabase = await getAdminClient()

    // ✅ Query the user_profiles table with admin privileges
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        username,
        full_name,
        bio,
        avatar_url,
        location,
        website,
        cover_url,
        birth_date,
        gender,
        phone,
        is_private,
        is_blocked,
        rank,
        rank_points,
        rank_level,
        is_verified,
        verification_status,
        posts_count,
        followers_count,
        following_count,
        last_seen,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[Profile/Me API] ❌ Profile fetch error:', {
        message: profileError.message,
        code: profileError.code
      })

      // If profile not found, return basic user info from JWT
      if (profileError.code === 'PGRST116') {
        console.log('[Profile/Me API] Profile not found in database, returning JWT data')
        
        const basicProfile = {
          success: true,
          data: {
            id: userId,
            email: user.email || '',
            username: user.user_metadata?.username || 'user',
            full_name: user.user_metadata?.full_name || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: '',
            location: '',
            website: '',
            is_verified: false,
            rank: 'Bronze I',
            rank_points: 0,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString()
          }
        }
        
        console.log('[Profile/Me API] ✅ Returning basic profile from JWT')
        console.log('[Profile/Me API] ============ GET PROFILE END ============')
        return basicProfile
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile'
      })
    }

    if (!profile) {
      console.error('[Profile/Me API] ❌ Profile not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Profile/Me API] ✅ Profile fetched successfully')
    console.log('[Profile/Me API] Profile data:', {
      id: profile.id,
      username: profile.username,
      rank: profile.rank,
      is_verified: profile.is_verified
    })

    // ============================================================================
    // STEP 3: Return success response
    // ============================================================================
    console.log('[Profile/Me API] STEP 3: Building response...')
    console.log('[Profile/Me API] ✅ Profile retrieved successfully')
    console.log('[Profile/Me API] ============ GET PROFILE END ============')

    return {
      success: true,
      data: profile
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

