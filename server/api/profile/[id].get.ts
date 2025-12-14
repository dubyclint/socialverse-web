// FILE: /server/api/profile/[id].get.ts
// ============================================================================
// GET PROFILE BY USER ID - PRODUCTION READY
// ============================================================================
// This endpoint fetches a user's complete profile including:
// - Basic profile information (name, username, avatar, bio, etc.)
// - Privacy settings
// - Social links
// - Verification badges
// - User statistics (followers, following, posts)
//
// Features:
// - Graceful fallback: Creates profile from auth data if not in database
// - Comprehensive error handling
// - Detailed logging for debugging
// - Optimized database queries
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
  privacy_settings: Record<string, any>
  social_links: Array<any>
  verification_badges: Array<any>
  stats: {
    followers: number
    following: number
    posts: number
  }
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
    
    const userId = getRouterParam(event, 'id')

    if (!userId || userId.trim() === '') {
      console.error('[Profile API] ❌ No user ID provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Profile API] ✅ User ID:', userId)

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
    let profileError = null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      profile = data
      profileError = error

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not found)
        console.warn('[Profile API] ⚠️ Profile query error:', profileError.message)
      }

      if (profile) {
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

      console.log('[Profile API] ℹ️ Profile object created:', {
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
          // Continue anyway - we have the data from auth
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
    // STEP 7: Fetch privacy settings
    // ============================================================================
    console.log('[Profile API] Step 7: Fetching privacy settings...')
    
    let privacySettings = {}

    try {
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('[Profile API] ⚠️ Privacy settings query error:', error.message)
      } else if (data) {
        privacySettings = data
        console.log('[Profile API] ✅ Privacy settings found')
      } else {
        console.log('[Profile API] ℹ️ No privacy settings found')
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Privacy settings fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 8: Fetch social links
    // ============================================================================
    console.log('[Profile API] Step 8: Fetching social links...')
    
    let socialLinks = []

    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.warn('[Profile API] ⚠️ Social links query error:', error.message)
      } else if (data) {
        socialLinks = data
        console.log('[Profile API] ✅ Found', socialLinks.length, 'social links')
      } else {
        console.log('[Profile API] ℹ️ No social links found')
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Social links fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 9: Fetch verification badges
    // ============================================================================
    console.log('[Profile API] Step 9: Fetching verification badges...')
    
    let verificationBadges = []

    try {
      const { data, error } = await supabase
        .from('verified_badge')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.warn('[Profile API] ⚠️ Verification badges query error:', error.message)
      } else if (data) {
        verificationBadges = data
        console.log('[Profile API] ✅ Found', verificationBadges.length, 'verification badges')
      } else {
        console.log('[Profile API] ℹ️ No verification badges found')
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Verification badges fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 10: Fetch user statistics (followers, following, posts)
    // ============================================================================
    console.log('[Profile API] Step 10: Fetching user statistics...')
    
    let stats = {
      followers: 0,
      following: 0,
      posts: 0
    }

    try {
      // Fetch followers count
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

      // Fetch following count
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

      // Fetch posts count
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (!postsError && postsCount !== null) {
        stats.posts = postsCount
        console.log('[Profile API] ✅ Posts count:', stats.posts)
      } else if (postsError) {
        console.warn('[Profile API] ⚠️ Posts count query error:', postsError.message)
      }
    } catch (err: any) {
      console.warn('[Profile API] ⚠️ Statistics fetch failed:', err.message)
    }

    // ============================================================================
    // STEP 11: Build and return response
    // ============================================================================
    console.log('[Profile API] Step 11: Building response...')

    const response: ProfileResponse = {
      success: true,
      profile: {
        ...profile,
        email: authUser.email || profile.email,
        verified: verificationBadges.length > 0 || profile.verified
      },
      privacy_settings: privacySettings,
      social_links: socialLinks,
      verification_badges: verificationBadges,
      stats
    }

    console.log('[Profile API] ========================================')
    console.log('[Profile API] ✅ Profile fetched successfully')
    console.log('[Profile API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Profile API] ========================================')
    console.error('[Profile API] ❌ ERROR:', error.message)
    console.error('[Profile API] Status Code:', error.statusCode)
    console.error('[Profile API] ========================================')

    // If it's already a proper error, throw it
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
