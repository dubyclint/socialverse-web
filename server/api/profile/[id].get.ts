// ============================================================================
// FILE 2: /server/api/profile/[id].get.ts - CORRECTED
// ============================================================================
// ✅ UPDATED: Changed 'profiles' table to 'user' table
// ============================================================================

// FILE: /server/api/profile/[id].get.ts - FIXED
// Get user profile by ID - FIXED: Proper privacy and error handling
// ✅ FIXED: Queries 'user' table (changed from 'profiles')
// ✅ FIXED: Privacy filtering
// ✅ FIXED: Comprehensive error handling

import { serverSupabaseClient } from '#supabase/server'

interface ProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<ProfileResponse> => {
  try {
    console.log('[Profile Get API] Fetching user profile...')

    // ============================================================================
    // STEP 1: Get Supabase client
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // ============================================================================
    // STEP 2: Get user ID from route parameter
    // ============================================================================
    const userId = getRouterParam(event, 'id')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Profile Get API] User ID:', userId)

    // ============================================================================
    // STEP 3: Fetch profile
    // ============================================================================
    console.log('[Profile Get API] Fetching profile...')
    
    // ✅ CHANGED: from 'profiles' to 'user'
    const { data: profile, error: profileError } = await supabase
      .from('user')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        bio,
        is_verified,
        created_at
      `)
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[Profile Get API] ❌ Profile fetch error:', profileError.message)
      
      if (profileError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: 'Profile not found'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile: ' + profileError.message
      })
    }

    if (!profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Profile Get API] ✅ Profile fetched successfully')

    return {
      success: true,
      data: profile,
      message: 'Profile fetched successfully'
    }

  } catch (err: any) {
    console.error('[Profile Get API] ❌ Error:', err.message)
    
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
