// ============================================================================
// FILE 3: /server/api/profile/[username].ts - CORRECTED
// ============================================================================
// ✅ UPDATED: Changed 'profiles' table to 'user' table
// ============================================================================

// FINAL FIX: /server/api/profile/[username].ts
// GET PROFILE BY USERNAME - CORRECTED for user table only
// ✅ CHANGED: Removed fallback logic, now uses 'user' table directly

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
    // STEP 3: Fetch from user table
    // ============================================================================
    console.log('[Profile Username API] Querying user table...')
    
    // ✅ CHANGED: Now queries 'user' table directly (no fallback needed)
    const { data: profile, error: userError } = await supabase
      .from('user')
      .select('*')
      .ilike('username', username)
      .single()

    if (userError) {
      console.error('[Profile Username API] ❌ User table error:', userError.message)
      throw createError({
        statusCode: 404,
        statusMessage: `User with username "${username}" not found`
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
