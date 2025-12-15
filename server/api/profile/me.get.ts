// FILE: /server/api/profile/me.get.ts - FIXED FOR PROFILES VIEW
// ============================================================================
// Get current user profile
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
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
    // STEP 2: Fetch profile from profiles view
    // ============================================================================
    console.log('[Profile Me API] Fetching profile...')
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
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
            user_id: userId,
            username: session.user.user_metadata?.username || session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            bio: null
          })
          .select()
          .single()

        if (createError) {
          console.error('[Profile Me API] ❌ Profile creation error:', createError.message)
          throw createError({
            statusCode: 500,
            statusMessage: 'Profile not found and could not be created'
          })
        }

        console.log('[Profile Me API] ✅ Profile created successfully')
        return {
          success: true,
          profile: newProfile,
          message: 'Profile created successfully'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile',
        data: { details: profileError.message }
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
      profile,
      message: 'Profile fetched successfully'
    }

  } catch (err: any) {
    console.error('[Profile Me API] ❌ Error:', err)

    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch profile',
      data: { details: err.message }
    })
  }
})
