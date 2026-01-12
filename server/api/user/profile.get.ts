// ============================================================================
// FIXED: /server/api/user/profile.get.ts
// ============================================================================
// Get current user's profile
// ✅ FIXED: Renamed error variable from 'createError' to 'profileCreateError'
//           to avoid shadowing the h3 createError function
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('[User Profile API] ============ GET USER PROFILE START ============')

  try {
    // Get authenticated user
    const authUser = await requireAuth(event)
    console.log('[User Profile API] Auth user ID:', authUser.id)
    console.log('[User Profile API] Auth user email:', authUser.email)

    // Use correct serverSupabaseClient function
    const supabase = await serverSupabaseClient(event)
    
    console.log('[User Profile API] Querying user_profiles table for user:', authUser.id)
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // If profile exists, return it
    if (!profileError && profile) {
      console.log('[User Profile API] ✅ Profile found')
      console.log('[User Profile API] Profile data:', {
        id: profile.id,
        username: profile.username,
        email: profile.email
      })
      console.log('[User Profile API] ============ GET USER PROFILE END ============')

      return {
        success: true,
        data: profile
      }
    }

    // Profile doesn't exist, create it
    if (profileError?.code === 'PGRST116') {
      console.log('[User Profile API] ⚠️ Profile not found (PGRST116), creating new profile...')
      
      const username = authUser.user_metadata?.username || 
                      authUser.email?.split('@')[0] || 
                      'user_' + authUser.id.substring(0, 8)
      
      const fullName = authUser.user_metadata?.full_name || 
                      authUser.email || 
                      'User'

      console.log('[User Profile API] Creating profile with:', {
        id: authUser.id,
        username: username,
        email: authUser.email,
        full_name: fullName
      })

      // ✅ FIXED: Changed 'error: createError' to 'error: profileCreateError'
      const { data: newProfile, error: profileCreateError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authUser.id,
            username: username.toLowerCase(),
            full_name: fullName,
            email: authUser.email,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            bio: '',
            location: '',
            website: '',
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      // ✅ FIXED: Updated error variable name
      if (profileCreateError) {
        console.error('[User Profile API] ❌ Profile creation failed:', {
          code: profileCreateError.code,
          message: profileCreateError.message,
          details: profileCreateError.details
        })
        
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to create profile: ${profileCreateError.message}`
        })
      }

      console.log('[User Profile API] ✅ Profile created successfully')
      console.log('[User Profile API] New profile:', {
        id: newProfile.id,
        username: newProfile.username,
        email: newProfile.email
      })
      console.log('[User Profile API] ============ GET USER PROFILE END ============')

      return {
        success: true,
        data: newProfile
      }
    }

    // Unexpected error
    console.error('[User Profile API] ❌ Unexpected profile error:', {
      code: profileError?.code,
      message: profileError?.message
    })
    
    throw createError({
      statusCode: 500,
      statusMessage: profileError?.message || 'Failed to fetch profile'
    })

  } catch (error: any) {
    console.error('[User Profile API] ❌ Error caught in catch block:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    })
    console.log('[User Profile API] ============ GET USER PROFILE ERROR END ============')

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to fetch profile'
    })
  }
})
