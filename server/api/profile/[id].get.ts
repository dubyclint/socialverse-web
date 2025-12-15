// FILE: /server/api/profile/[id].get.ts (COMPLETE FIXED VERSION)
// ============================================================================
// GET PROFILE BY USER ID - FIXED: Proper error handling and response structure
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
  error?: string
}

export default defineEventHandler(async (event): Promise<ProfileResponse> => {
  try {
    console.log('[Profile API] ======================================')
    console.log('[Profile API] Fetching profile...')
    console.log('[Profile API] ======================================')

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
      console.warn('[Profile API] ⚠️ Invalid user ID format (not UUID):', userId)
      // Continue anyway - might be a valid ID in different format
    }

    // ============================================================================
    // STEP 4: Fetch profile from database
    // ============================================================================
    console.log('[Profile API] Step 4: Fetching profile from database...')
    
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (dbError) {
      console.error('[Profile API] ❌ Database error:', dbError.message)
      
      if (dbError.code === 'PGRST116') {
        // Not found
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
      console.warn('[Profile API] ❌ Profile not found for user:', userId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Profile API] ✅ Profile fetched successfully:', userId)

    return {
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        verified: profile.verified,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    }
  } catch (error: any) {
    console.error('[Profile API] ❌ Error:', error.message || error)
    
    // If it's already an H3 error, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, return 500 error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
