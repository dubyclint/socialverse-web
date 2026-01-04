// ============================================================================
// FILE: /server/api/profile/me.get.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Get current user profile with complete data including rank & verification
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        bio,
        avatar_url,
        location,
        website,
        interests,
        colors,
        items,
        profile_completed,
        rank,
        rank_points,
        rank_level,
        is_verified,
        verified_badge_type,
        verified_at,
        verification_status,
        badge_count,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('[Profile/Me API] ❌ Profile fetch error:', {
        message: profileError.message,
        code: profileError.code
      })

      if (profileError.code === 'PGRST116') {
        console.log('[Profile/Me API] Profile not found, attempting to create...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            full_name: session.user.user_metadata?.full_name || 'User',
            bio: null,
            avatar_url: null,
            location: null,
            website: null,
            interests: [],
            colors: {},
            items: [],
            profile_completed: false,
            rank: 'Bronze I',
            rank_points: 0,
            rank_level: 1,
            is_verified: false,
            verified_badge_type: null,
            verified_at: null,
            verification_status: 'none',
            badge_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('[Profile/Me API] ❌ Failed to create profile:', createError.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create profile'
          })
        }

        console.log('[Profile/Me API] ✅ Profile created successfully')
        console.log('[Profile/Me API] ============ GET PROFILE END ============')

        return {
          success: true,
          data: newProfile
        }
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
      user_id: profile.user_id,
      full_name: profile.full_name,
      rank: profile.rank,
      is_verified: profile.is_verified,
      profile_completed: profile.profile_completed
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

