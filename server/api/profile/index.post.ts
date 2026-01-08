// ============================================================================
// FILE 6: /server/api/profile/index.post.ts - CORRECTED
// ============================================================================
// ✅ UPDATED: Changed 'profiles' table to 'user' table
// ============================================================================

// server/api/profile/index.post.ts - UPDATE PROFILE ENDPOINT
// ✅ CHANGED: Queries 'user' table instead of 'profiles'

export default defineEventHandler(async (event) => {
  try {
    // Get user from Supabase auth
    const user = await requireAuth(event)
    
    if (!user?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Get request body
    const body = await readBody(event)

    console.log('[Profile API] Updating profile for user:', user.id)

    // Get Supabase client
    const supabase = useSupabaseClient(event)

    // ✅ CHANGED: from 'profiles' to 'user'
    // Update profile
    const { data, error } = await supabase
      .from('user')
      .upsert({
        user_id: user.id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Profile API] Error updating profile:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile'
      })
    }

    return data
  } catch (err: any) {
    console.error('[Profile API] Error:', err)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Internal server error'
    })
  }
})
