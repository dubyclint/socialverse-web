// COMPLETE FIX: /server/api/profile/[username].ts
// ============================================================================
// GET PROFILE BY USERNAME - FIXED: Proper error handling and database queries
// ✅ FIXED: Correct Supabase client initialization
// ✅ FIXED: Proper error handling for missing profiles
// ✅ FIXED: Case-insensitive username search
// ✅ FIXED: Comprehensive logging
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface ProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<ProfileResponse> => {
  try {
    console.log('[Profile Username API] Fetching user profile...')

    // ============================================================================
    // STEP 1: Get Supabase client
    // ============================================================================
    const supabase = await serverSupabaseClient(event)

    // ============================================================================
    // STEP 2: Get username from route parameter
    // ============================================================================
    const username = getRouterParam(event, 'username')

    if (!username) {
      console.error('[Profile Username API] ❌ Username is required')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      })
    }

    console.log('[Profile Username API] Username:', username)

    // ============================================================================
    // STEP 3: Fetch profile from profiles view
    // ============================================================================
    console.log('[Profile Username API] Querying profiles table...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        username,
        full_name,
        email,
        avatar_url,
        bio,
        is_verified,
        verification_status,
        profile_completed,
        created_at,
        updated_at
      `)
      .ilike('username', username)  // Case-insensitive search
      .single()

    if (profileError) {
      console.error('[Profile Username API] ❌ Profile fetch error:', profileError.message)
      
      // Handle "no rows returned" error
      if (profileError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: `User with username "${username}" not found`
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile: ' + profileError.message
      })
    }

    if (!profile) {
      console.error('[Profile Username API] ❌ Profile not found for username:', username)
      throw createError({
        statusCode: 404,
        statusMessage: `User with username "${username}" not found`
      })
    }

    console.log('[Profile Username API] ✅ Profile fetched successfully:', profile.username)

    return {
      success: true,
      data: profile,
      message: 'Profile fetched successfully'
    }

  } catch (err: any) {
    console.error('[Profile Username API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching profile',
      data: { details: err.message }
    })
  }
})
