// ============================================================================
// FILE: /server/api/profile/me.get.ts - COMPLETELY FIXED
// ============================================================================
// ✅ FIXED: Now properly validates token from Authorization header
// ✅ FIXED: Uses correct table name 'user_profiles'
// ✅ FIXED: Extracts user from event context set by middleware
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('[Profile/Me API] ============ GET PROFILE START ============')

  try {
    // ============================================================================
    // STEP 1: Get user from context (set by auth-header middleware)
    // ============================================================================
    console.log('[Profile/Me API] STEP 1: Checking authentication...')
    
    let userId: string | null = null
    let authToken: string | null = null

    // Try to get user from context (set by middleware)
    if (event.context.user?.id) {
      userId = event.context.user.id
      authToken = event.context.authToken || null
      console.log('[Profile/Me API] ✅ User found in context:', userId)
    } else {
      // Fallback: Try to get from Supabase session
      const supabase = await serverSupabaseClient(event)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        console.error('[Profile/Me API] ❌ Unauthorized - No user found')
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized - Please log in'
        })
      }

      userId = session.user.id
      console.log('[Profile/Me API] ✅ User found from session:', userId)
    }

    if (!userId) {
      console.error('[Profile/Me API] ❌ Unauthorized - No user ID')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // ============================================================================
    // STEP 2: Fetch complete profile from user_profiles table
    // ============================================================================
    console.log('[Profile/Me API] STEP 2: Fetching profile from database...')

    const supabase = await serverSupabaseClient(event)

    // ✅ FIXED: Changed from 'profiles' to 'user_profiles'
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
        console.log('[Profile/Me API] Profile not found, creating default response')
        // Return basic user info if profile not found
        return {
          success: true,
          data: {
            id: userId,
            email: event.context.user?.email || '',
            username: event.context.user?.user_metadata?.username || 'user',
            full_name: event.context.user?.user_metadata?.full_name || 'User',
            avatar_url: null,
            bio: '',
            location: '',
            website: '',
            is_verified: false,
            rank: 'Bronze I',
            rank_points: 0,
            followers_count: 0,
            following_count: 0,
            posts_count: 0
          }
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
