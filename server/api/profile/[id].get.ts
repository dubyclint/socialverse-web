// FILE 6: /server/api/profile/[id].get.ts
// ============================================================================
// GET PROFILE BY USER ID - IMPROVED: Enhanced error handling and diagnostics
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface ProfileResponse {
  success: boolean
  profile?: {
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
  stats?: {
    followers: number
    following: number
    posts: number
  }
  error?: string
  message?: string
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
    
    let supabase
    try {
      supabase = await serverSupabaseClient(event)
    } catch (err: any) {
      console.error('[Profile API] ❌ Supabase initialization error:', err.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase initialization failed: ' + err.message
      })
    }
    
    if (!supabase) {
      console.error('[Profile API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database client not available'
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
    // STEP 4: Fetch profile from database
    // ============================================================================
    console.log('[Profile API] Step 4: Fetching profile from database...')
    
    let profile = null
    let profileError = null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('[Profile API] ⚠️ Profile query error:', error.message, 'Code:', error.code)
        profileError = error
      } else {
        profile = data
        console.log('[Profile API] ✅ Profile found in database')
      }
    } catch (err: any) {
      console.error('[Profile API] ❌ Profile fetch error:', err.message)
      profileError = err
    }

    // ============================================================================
    // STEP 5: If no profile, try to get from auth
    // ============================================================================
    if (!profile) {
      console.log('[Profile API] Step 5: Profile not found, trying auth...')
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)
        
        if (authError) {
          console.warn('[Profile API] ⚠️ Auth fetch error:', authError.message)
        } else if (user) {
          console.log('[Profile API] ✅ User found in auth')
          
          profile = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            username: user.user_metadata?.username || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: user.user_metadata?.bio || null,
            location: user.user_metadata?.location || null,
            website: user.user_metadata?.website || null,
            verified: false,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      } catch (err: any) {
        console.warn('[Profile API] ⚠️ Auth fallback error:', err.message)
      }
    }

    // ============================================================================
    // STEP 6: Return response
    // ============================================================================
    if (!profile) {
      console.error('[Profile API] ❌ Profile not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'User profile not found'
      })
    }

    console.log('[Profile API] ✅ Returning profile')

    return {
      success: true,
      profile,
      stats: {
        followers: 0,
        following: 0,
        posts: 0
      }
    }

  } catch (error: any) {
    console.error('[Profile API] ❌ Error:', error.message || error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch profile: ' + (error.message || 'Unknown error')
    })
  }
})
