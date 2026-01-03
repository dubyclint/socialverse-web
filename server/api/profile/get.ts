// ============================================================================
// COMPLETE FILE: /server/api/profile/get.ts
// ============================================================================
// Get user profile by ID (with UUID validation)
// Called by: /stores/profile.ts fetchProfile()
// Endpoint: GET /api/profile/get?userId=...
// ============================================================================

export default defineEventHandler(async (event) => {
  console.log('[Profile API] ============ GET PROFILE START ============')

  try {
    // Get user ID from query
    const userId = getQuery(event).userId as string

    if (!userId) {
      console.error('[Profile API] ❌ No user ID provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.error('[Profile API] ❌ Invalid UUID format:', userId)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid user ID format'
      })
    }

    console.log('[Profile API] Fetching profile for user:', userId)

    // Fetch profile from database
    const supabase = await useSupabaseServer(event)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[Profile API] ❌ Profile fetch error:', profileError.message)
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    if (!profile) {
      console.error('[Profile API] ❌ Profile not found for user:', userId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Profile API] ✅ Profile fetched successfully')
    console.log('[Profile API] ============ GET PROFILE END ============')

    return {
      success: true,
      data: profile
    }
  } catch (error: any) {
    console.error('[Profile API] ❌ Error:', error.message)
    console.log('[Profile API] ============ GET PROFILE ERROR END ============')

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch profile'
    })
  }
})
