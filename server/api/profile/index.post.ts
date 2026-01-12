// ============================================================================
// CORRECTED FIX #4: /server/api/profile/index.post.ts
// ============================================================================
// Update/Create user profile
// ✅ FIXED: Changed 'user' table to 'user_profiles' (ACTUAL TABLE)
// ✅ FIXED: Changed useSupabaseClient to getAdminClient
// ✅ FIXED: Changed 'user_id' to 'id' (correct column name)
// ✅ FIXED: Proper error handling and validation
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    console.log('[Profile API] ============ UPDATE PROFILE START ============')

    // ============================================================================
    // STEP 1: Get authenticated user from context
    // ============================================================================
    console.log('[Profile API] STEP 1: Authenticating user...')
    
    const user = event.context.user
    
    if (!user?.id) {
      console.error('[Profile API] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
    console.log('[Profile API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Get request body and validate
    // ============================================================================
    console.log('[Profile API] STEP 2: Reading request body...')
    
    const body = await readBody(event)

    if (!body || Object.keys(body).length === 0) {
      console.error('[Profile API] ❌ Empty request body')
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body cannot be empty'
      })
    }

    console.log('[Profile API] ✅ Request body received')
    console.log('[Profile API] Fields to update:', Object.keys(body))

    // ============================================================================
    // STEP 3: Get admin client for database operations
    // ============================================================================
    console.log('[Profile API] STEP 3: Getting admin client...')

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    console.log('[Profile API] ✅ Admin client obtained')

    // ============================================================================
    // STEP 4: Update/Upsert profile in user_profiles table
    // ============================================================================
    console.log('[Profile API] STEP 4: Updating profile in user_profiles table...')

    // ✅ FIXED: Use user_profiles table with 'id' column
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Profile API] ❌ Update error:', error.message)
      console.error('[Profile API] Error code:', error.code)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + error.message
      })
    }

    if (!data) {
      console.error('[Profile API] ❌ No data returned after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    console.log('[Profile API] ✅ Profile updated successfully')
    console.log('[Profile API] Updated fields:', Object.keys(body))
    console.log('[Profile API] ============ UPDATE PROFILE END ============')

    return {
      success: true,
      data: data,
      message: 'Profile updated successfully'
    }

  } catch (err: any) {
    console.error('[Profile API] ============ UPDATE PROFILE ERROR ============')
    console.error('[Profile API] Error type:', err?.constructor?.name)
    console.error('[Profile API] Error message:', err?.message)
    console.error('[Profile API] ============ END ERROR ============')
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Internal server error'
    })
  }
})
