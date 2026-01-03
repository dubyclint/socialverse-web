// ============================================================================
// COMPLETE FILE: /server/api/user/profile.ts
// ============================================================================
// Get current user's profile (CORRECT ENDPOINT)
// This is the PRIMARY endpoint used by the app
// ============================================================================

export default defineEventHandler(async (event) => {
  console.log('[User Profile API] ============ GET USER PROFILE START ============')

  try {
    // Get authenticated user
    const authUser = await requireAuth(event)
    console.log('[User Profile API] Auth user ID:', authUser.id)

    // Fetch profile from database
    const supabase = await useSupabaseServer(event)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError) {
      console.warn('[User Profile API] ⚠️ Profile not found, creating from auth data...')
      
      // Create profile from auth data if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.id,
            username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
            full_name: authUser.user_metadata?.full_name || authUser.email,
            email: authUser.email,
            avatar_url: authUser.user_metadata?.avatar_url || '/default-avatar.svg',
            bio: '',
            location: '',
            website: '',
            is_verified: false,
            profile_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('[User Profile API] ❌ Profile creation failed:', createError.message)
        throw createError
      }

      console.log('[User Profile API] ✅ Profile created from auth data')
      console.log('[User Profile API] ============ GET USER PROFILE END ============')

      return {
        success: true,
        data: newProfile
      }
    }

    console.log('[User Profile API] ✅ Profile fetched successfully')
    console.log('[User Profile API] ============ GET USER PROFILE END ============')

    return {
      success: true,
      data: profile
    }
  } catch (error: any) {
    console.error('[User Profile API] ❌ Error:', error.message)
    console.log('[User Profile API] ============ GET USER PROFILE ERROR END ============')

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch profile'
    })
  }
})

