// ============================================================================
// FILE: /server/api/profile/me.get.ts - CORRECTED
// ============================================================================
// ✅ FIXED: Changed 'user' table to 'user_profiles' table
// ✅ FIXED: Changed 'user_id' field to 'id' field
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('[Profile/Me API] ============ GET PROFILE START ============')

  try {
    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    console.log('[Profile/Me API] STEP 1: Authenticating user...')
    
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Profile/Me API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Profile/Me API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Fetch complete profile with all fields
    // ============================================================================
    console.log('[Profile/Me API] STEP 2: Fetching profile...')

    // ✅ CHANGED: from 'user' to 'user_profiles'
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

      if (profileError.code === 'PGRST116') {
        console.log('[Profile/Me API] Profile not found')
        throw createError({
          statusCode: 404,
          statusMessage: 'Profile not found'
        })
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
      full_name: profile.full_name,
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
