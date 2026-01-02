// ============================================================================
// FILE 2: /server/api/user/profile.get.ts - ENHANCED VERSION
// ============================================================================
// PHASE 5: Get User Profile Endpoint
// Purpose: Fetch current user's profile data from Supabase
// Features:
//   ✅ Requires authentication
//   ✅ Fetches profile from profiles table
//   ✅ Returns complete profile data
//   ✅ Handles missing profiles gracefully
//   ✅ Comprehensive error handling
//   ✅ Detailed logging
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[User Profile API] ============ GET PROFILE START ============')

    // ============================================================================
    // STEP 1: Require authentication
    // ============================================================================
    console.log('[User Profile API] STEP 1: Checking authentication...')

    const user = await requireAuth(event)

    if (!user?.id) {
      console.error('[User Profile API] ❌ User not authenticated')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please login'
      })
    }

    console.log('[User Profile API] ✅ User authenticated:', user.id)

    // ============================================================================
    // STEP 2: Initialize Supabase client
    // ============================================================================
    console.log('[User Profile API] STEP 2: Initializing Supabase client...')

    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[User Profile API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database unavailable'
      })
    }

    console.log('[User Profile API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 3: Fetch profile from profiles table
    // ============================================================================
    console.log('[User Profile API] STEP 3: Fetching profile from database...')
    console.log('[User Profile API] User ID:', user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        username_lower,
        full_name,
        email,
        avatar_url,
        bio,
        location,
        website,
        verified,
        followers_count,
        following_count,
        posts_count,
        profile_complete,
        created_at,
        updated_at
      `)
      .eq('id', user.id)
      .single()

    // ============================================================================
    // STEP 4: Handle profile fetch errors
    // ============================================================================
    if (profileError) {
      console.warn('[User Profile API] ⚠️ Profile fetch error:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details
      })

      // ============================================================================
      // FALLBACK 1: Profile doesn't exist - create from auth user
      // ============================================================================
      if (profileError.code === 'PGRST116') {
        console.log('[User Profile API] Profile not found (PGRST116), creating from auth user...')

        const username = user.user_metadata?.username || 
                        user.email?.split('@')[0] || 
                        'user'
        const fullName = user.user_metadata?.full_name || username

        console.log('[User Profile API] Creating profile with:', {
          username,
          fullName,
          email: user.email
        })

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username.toLowerCase(),
            username_lower: username.toLowerCase(),
            full_name: fullName,
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: user.user_metadata?.bio || '',
            location: user.user_metadata?.location || '',
            website: user.user_metadata?.website || '',
            verified: user.user_metadata?.verified || false,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.warn('[User Profile API] ⚠️ Failed to create profile:', {
            message: createError.message,
            code: createError.code
          })

          // ============================================================================
          // FALLBACK 2: Profile creation failed - return auth user data
          // ============================================================================
          console.log('[User Profile API] Returning fallback profile from auth user')
          console.log('[User Profile API] ✅ GET PROFILE END (fallback)')

          return {
            success: true,
            data: {
              id: user.id,
              username: username.toLowerCase(),
              username_lower: username.toLowerCase(),
              full_name: fullName,
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url || null,
              bio: user.user_metadata?.bio || '',
              location: user.user_metadata?.location || '',
              website: user.user_metadata?.website || '',
              verified: user.user_metadata?.verified || false,
              followers_count: 0,
              following_count: 0,
              posts_count: 0,
              profile_complete: false,
              wallet_balance: '$0.00',
              is_verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            message: 'Profile fetched (from auth fallback)'
          }
        }

        console.log('[User Profile API] ✅ Profile created successfully')
        console.log('[User Profile API] New profile:', {
          id: newProfile.id,
          username: newProfile.username,
          full_name: newProfile.full_name
        })

        // ============================================================================
        // RETURN NEWLY CREATED PROFILE
        // ============================================================================
        console.log('[User Profile API] ✅ GET PROFILE END (newly created)')

        return {
          success: true,
          data: {
            id: newProfile.id,
            username: newProfile.username,
            username_lower: newProfile.username_lower,
            full_name: newProfile.full_name,
            email: newProfile.email,
            avatar_url: newProfile.avatar_url,
            bio: newProfile.bio,
            location: newProfile.location,
            website: newProfile.website,
            verified: newProfile.verified,
            followers_count: newProfile.followers_count,
            following_count: newProfile.following_count,
            posts_count: newProfile.posts_count,
            profile_complete: newProfile.profile_complete,
            wallet_balance: '$0.00',
            is_verified: newProfile.verified,
            created_at: newProfile.created_at,
            updated_at: newProfile.updated_at
          },
          message: 'Profile fetched successfully'
        }
      }

      // ============================================================================
      // FALLBACK 3: Other profile fetch errors - return auth user data
      // ============================================================================
      console.warn('[User Profile API] Using auth user data as fallback')
      console.log('[User Profile API] ✅ GET PROFILE END (auth fallback)')

      const username = user.user_metadata?.username || 
                      user.email?.split('@')[0] || 
                      'user'
      const fullName = user.user_metadata?.full_name || username

      return {
        success: true,
        data: {
          id: user.id,
          username: username.toLowerCase(),
          username_lower: username.toLowerCase(),
          full_name: fullName,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: user.user_metadata?.bio || '',
          location: user.user_metadata?.location || '',
          website: user.user_metadata?.website || '',
          verified: user.user_metadata?.verified || false,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          profile_complete: false,
          wallet_balance: '$0.00',
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        message: 'Profile fetched (from auth fallback)'
      }
    }

    if (!profile) {
      console.error('[User Profile API] ❌ Profile not found and could not be created')
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[User Profile API] ✅ Profile fetched successfully')
    console.log('[User Profile API] Profile data:', {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      email: profile.email
    })

    // ============================================================================
    // STEP 5: Return success response with complete profile data
    // ============================================================================
    console.log('[User Profile API] STEP 5: Building success response...')
    console.log('[User Profile API] ✅ GET PROFILE END')

    return {
      success: true,
      data: {
        id: profile.id,
        username: profile.username,
        username_lower: profile.username_lower,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        verified: profile.verified,
        followers_count: profile.followers_count,
        following_count: profile.following_count,
        posts_count: profile.posts_count,
        profile_complete: profile.profile_complete,
        wallet_balance: '$0.00',
        is_verified: profile.verified,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      message: 'Profile fetched successfully'
    }

  } catch (error: any) {
    console.error('[User Profile API] ============ GET PROFILE ERROR ============')
    console.error('[User Profile API] Error type:', error.constructor.name)
    console.error('[User Profile API] Error message:', error.message)
    console.error('[User Profile API] Error status:', error.statusCode)
    console.error('[User Profile API] Error details:', error.statusMessage)
    console.error('[User Profile API] ============ END ERROR ============')

    // If it's already a formatted error, throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, return generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch profile - please try again'
    })
  }
})
