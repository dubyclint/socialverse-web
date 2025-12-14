// FILE: /server/api/profile/[id].get.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// GET PROFILE BY USER ID - FIXED: Proper error handling and response structure
// ============================================================================
// ✅ CRITICAL FIX: Properly extracts user ID from route parameter
// ✅ Returns 400 error if user ID is missing or invalid
// ✅ Returns 404 error if user not found
// ✅ Comprehensive error handling at each step
// ✅ Detailed logging for debugging
// ✅ Proper response structure with all required fields
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface ProfileResponse {
  success: boolean
  profile: {
    id: string
    email: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
    location: string | null
    website: string | null
    verified: boolean
    created_at: string
    updated_at: string
  }
  stats: {
    followers: number
    following: number
    posts: number
  }
  ranks: Array<any>
  verification_status: string | null
}

export default defineEventHandler(async (event): Promise<ProfileResponse> => {
  try {
    console.log('[Profile API] ========================================')
    console.log('[Profile API] Fetching profile...')
    console.log('[Profile API] ========================================')

    // ============================================================================
    // STEP 1: Initialize Supabase client
    // ============================================================================
    console.log('[Profile API] Step 1: Initializing Supabase client...')
    
    const supabase = await serverSupabaseClient(event)
    
    if (!supabase) {
      console.error('[Profile API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Profile API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Get user ID from route parameter
    // ============================================================================
    console.log('[Profile API] Step 2: Extracting user ID from route...')
    
    // ✅ CRITICAL FIX: Properly extract user ID from route parameter
    const userId = getRouterParam(event, 'id')

    if (!userId || userId.trim() === '') {
      console.error('[Profile API] ❌ No user ID provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Profile API] ✅ User ID extracted:', userId)

    // ============================================================================
    // STEP 3: Validate user ID format (UUID)
    // ============================================================================
    console.log('[Profile API] Step 3: Validating user ID format...')
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(userId)) {
      console.error('[Profile API] ❌ Invalid user ID format:', userId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format'
      })
    }

    console.log('[Profile API] ✅ User ID format is valid')

    // ============================================================================
    // STEP 4: Fetch Supabase auth user data
    // ============================================================================
    console.log('[Profile API] Step 4: Fetching Supabase auth user...')
    
    let authUser = null
    let authError = null

    try {
      const result = await supabase.auth.admin.getUserById(userId)
      authUser = result.data?.user
      authError = result.error
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Auth admin call failed:', err.message)
      // Try alternative method
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user?.id === userId) {
        authUser = user
      } else {
        authError = error
      }
    }

    if (authError || !authUser) {
      console.error('[Profile API] ❌ User not found in auth:', authError?.message)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    console.log('[Profile API] ✅ Auth user found:', authUser.email)

    // ============================================================================
    // STEP 5: Fetch profile from profiles table
    // ============================================================================
    console.log('[Profile API] Step 5: Fetching profile from database...')
    
    let profile = null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not found)
        console.warn('[Profile API] ⚠️ Profile query error:', error.message)
      }

      if (data) {
        profile = data
        console.log('[Profile API] ✅ Profile found in database')
      } else {
        console.log('[Profile API] ℹ️ Profile not found in database, will create from auth data')
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Profile table query failed:', err.message)
      console.log('[Profile API] ℹ️ Will create profile from auth data')
    }

    // ============================================================================
    // STEP 6: If no profile exists, create one from auth user data
    // ============================================================================
    if (!profile) {
      console.log('[Profile API] Step 6: Creating profile from auth user data...')
      
      profile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || `user_${authUser.id.slice(0, 8)}`,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        bio: authUser.user_metadata?.bio || null,
        location: authUser.user_metadata?.location || null,
        website: authUser.user_metadata?.website || null,
        verified: false,
        created_at: authUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('[Profile API] ℹ️ Profile object created from auth data:', {
        id: profile.id,
        email: profile.email,
        username: profile.username
      })

      // Try to insert profile into database
      try {
        console.log('[Profile API] Attempting to insert profile into database...')
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profile])

        if (insertError) {
          console.warn('[Profile API] ⚠️ Could not insert profile:', insertError.message)
          console.log('[Profile API] ℹ️ Will return profile data from auth (not persisted)')
        } else {
          console.log('[Profile API] ✅ Profile inserted into database')
        }
      } catch (err: any) {
        console.warn('[Profile API] ⚠️ Profile insert failed:', err.message)
        console.log('[Profile API] ℹ️ Will return profile data from auth (not persisted)')
      }
    }

    // ============================================================================
    // STEP 7: Fetch user statistics (followers, following, posts)
    // ============================================================================
    console.log('[Profile API] Step 7: Fetching user statistics...')
    
    let stats = {
      followers: 0,
      following: 0,
      posts: 0
    }

    try {
      // Fetch followers count - with better error handling
      try {
        const { count: followersCount, error: followersError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId)

        if (!followersError && followersCount !== null) {
          stats.followers = followersCount
          console.log('[Profile API] ✅ Followers count:', stats.followers)
        } else if (followersError) {
          console.warn('[Profile API] ⚠️ Followers count query error:', followersError.message)
        }
      } catch (err: any) {
        console.warn('[Profile API] ⚠️ Followers count fetch failed:', err.message)
      }

      // Fetch following count - with better error handling
      try {
        const { count: followingCount, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)

        if (!followingError && followingCount !== null) {
          stats.following = followingCount
          console.log('[Profile API] ✅ Following count:', stats.following)
        } else if (followingError) {
          console.warn('[Profile API] ⚠️ Following count query error:', followingError.message)
        }
      } catch (err: any) {
        console.warn('[Profile API] ⚠️ Following count fetch failed:', err.message)
      }

      // Fetch posts count - with better error handling
      try {
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('is_deleted', false) // ✅ Only count non-deleted posts

        if (!postsError && postsCount !== null) {
          stats.posts = postsCount
          console.log('[Profile API] ✅ Posts count:', stats.posts)
        } else if (postsError) {
          console.warn('[Profile API] ⚠️ Posts count query error:', postsError.message)
        }
      } catch (err: any) {
        console.warn('[Profile API] ⚠️ Posts count fetch failed:', err.message)
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Statistics fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 8: Fetch user ranks
    // ============================================================================
    console.log('[Profile API] Step 8: Fetching user ranks...')
    
    let ranks = []

    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.warn('[Profile API] ⚠️ Ranks query error:', error.message)
      } else if (data) {
        ranks = data
        console.log('[Profile API] ✅ Found', ranks.length, 'ranks')
      } else {
        console.log('[Profile API] ℹ️ No ranks found')
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Ranks fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 9: Fetch verification status from badge_requests
    // ============================================================================
    console.log('[Profile API] Step 9: Fetching verification status...')
    
    let verificationStatus = null

    try {
      const { data, error } = await supabase
        .from('badge_requests')
        .select('status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not found)
        console.warn('[Profile API] ⚠️ Badge request query error:', error.message)
      } else if (data) {
        verificationStatus = data.status
        console.log('[Profile API] ✅ Verification status:', verificationStatus)
      } else {
        console.log('[Profile API] ℹ️ No verification badge request found')
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Verification status fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 10: Build and return response
    // ============================================================================
    console.log('[Profile API] Step 10: Building response...')

    // ✅ CRITICAL FIX: Ensure all required fields are present
    const response: ProfileResponse = {
      success: true,
      profile: {
        id: profile.id || authUser.id,
        email: authUser.email || profile?.email || '',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || 'User',
        username: profile?.username || authUser.user_metadata?.username || `user_${authUser.id.slice(0, 8)}`,
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        bio: profile?.bio || authUser.user_metadata?.bio || null,
        location: profile?.location || authUser.user_metadata?.location || null,
        website: profile?.website || authUser.user_metadata?.website || null,
        verified: verificationStatus === 'approved',
        created_at: profile?.created_at || authUser.created_at || new Date().toISOString(),
        updated_at: profile?.updated_at || new Date().toISOString()
      },
      stats,
      ranks,
      verification_status: verificationStatus
    }

    console.log('[Profile API] ========================================')
    console.log('[Profile API] ✅ Profile fetched successfully')
    console.log('[Profile API] User ID:', response.profile.id)
    console.log('[Profile API] Username:', response.profile.username)
    console.log('[Profile API] Stats:', stats)
    console.log('[Profile API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Profile API] ========================================')
    console.error('[Profile API] ❌ ERROR:', error.message)
    console.error('[Profile API] Status Code:', error.statusCode)
    console.error('[Profile API] Stack:', error.stack)
    console.error('[Profile API] ========================================')

    // ✅ CRITICAL FIX: If it's already a proper error, throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch profile'
    })
  }
})
