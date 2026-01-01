// ============================================================================
// FINAL FIX: /server/api/profile/[username].ts
// ============================================================================
// GET PROFILE BY USERNAME - CORRECTED for actual table structure
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
    // STEP 3: Try to fetch from profiles view first
    // ============================================================================
    console.log('[Profile Username API] Querying profiles view...')
    
    let profile = null

    const { data: profileData, error: viewError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .single()

    if (!viewError && profileData) {
      profile = profileData
      console.log('[Profile Username API] ✅ Profile found in profiles view')
    } else if (viewError) {
      console.warn('[Profile Username API] ⚠️ Profiles view error:', viewError.message)
      
      // ============================================================================
      // STEP 4: Fallback to user table if profiles view doesn't exist
      // ============================================================================
      console.log('[Profile Username API] Falling back to user table...')
      
      const { data: userData, error: userError } = await supabase
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

      if (userData) {
        // Map user table to profile format
        profile = {
          id: userData.id,
          user_id: userData.user_id,
          username: userData.username,
          full_name: userData.display_name || 'User',
          email: userData.email,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          is_verified: userData.is_verified || false,
          verification_status: userData.verification_status || 'unverified',
          profile_completed: userData.profile_completed || false,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
          posts_count: userData.posts_count || 0,
          followers_count: userData.followers_count || 0,
          following_count: userData.following_count || 0,
          status: userData.status
        }
        console.log('[Profile Username API] ✅ Profile found in user table')
      }
    }

    // ============================================================================
    // STEP 5: Handle not found
    // ============================================================================
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
