// FILE: /server/api/profile/me.get.ts - FIXED FOR PROFILES VIEW
// ============================================================================
// Get current user profile - FIXED: Proper error handling and profile creation
// ✅ FIXED: Queries 'profiles' table consistently
// ✅ FIXED: Auto-creates profile if missing
// ✅ FIXED: Comprehensive error handling
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
    console.log('[Profile Me API] Fetching current user profile...')

    // ============================================================================
    // STEP 1: Get Supabase client and session
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Profile Me API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Profile Me API] User ID:', userId)

    // ============================================================================
    // STEP 2: Fetch profile from profiles table
    // ============================================================================
    console.log('[Profile Me API] Fetching profile...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
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
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[Profile Me API] ❌ Profile fetch error:', profileError.message)
      
      // If profile not found, try to create it
      if (profileError.code === 'PGRST116') {
        console.log('[Profile Me API] Profile not found, attempting to create...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: session.user.user_metadata?.username || `user_${userId.slice(0, 8)}`,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            email: session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            bio: null,
            profile_completed: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('[Profile Me API] ❌ Profile creation failed:', createError.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create profile'
          })
        }

        console.log('[Profile Me API] ✅ Profile created successfully')
        return {
          success: true,
          data: newProfile,
          message: 'Profile created successfully'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile: ' + profileError.message
      })
    }

    if (!profile) {
      console.error('[Profile Me API] ❌ Profile not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Profile Me API] ✅ Profile fetched successfully')

    return {
      success: true,
      data: profile,
      message: 'Profile fetched successfully'
    }

  } catch (err: any) {
    console.error('[Profile Me API] ❌ Error:', err.message)
    
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
