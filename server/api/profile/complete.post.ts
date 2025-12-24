// FILE: /server/api/profile/complete.post.ts - FIXED
// ============================================================================
// Complete user profile - FIXED: Proper validation and completion flag
// ✅ FIXED: Validates required fields
// ✅ FIXED: Sets profile_completed flag
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface CompleteProfileRequest {
  username?: string
  full_name?: string
  bio?: string
  interests?: string[]
}

interface CompleteProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<CompleteProfileResponse> => {
  try {
    console.log('[Profile Complete API] Processing profile completion...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Profile Complete API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Profile Complete API] User ID:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    const body = await readBody<CompleteProfileRequest>(event)
    console.log('[Profile Complete API] Completion data:', {
      username: body.username,
      full_name: body.full_name,
      bio: body.bio,
      interests: body.interests?.length || 0
    })

    // ============================================================================
    // STEP 3: Validate required fields
    // ============================================================================
    const requiredFields = ['username', 'full_name', 'bio']
    const missingFields = requiredFields.filter(field => !body[field as keyof CompleteProfileRequest])

    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required fields: ${missingFields.join(', ')}`
      })
    }

    // Validate username
    const username = (body.username as string).toLowerCase().trim()
    if (!/^[a-z0-9_-]+$/i.test(username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }

    if (username.length < 3 || username.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be between 3 and 30 characters'
      })
    }

    // Check if username already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .single()

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    console.log('[Profile Complete API] ✅ Validation passed')

    // ============================================================================
    // STEP 4: Update profile with completion flag
    // ============================================================================
    console.log('[Profile Complete API] Completing profile...')

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        full_name: (body.full_name as string).trim(),
        bio: (body.bio as string).trim(),
        interests: body.interests || [],
        profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile Complete API] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to complete profile: ' + updateError.message
      })
    }

    console.log('[Profile Complete API] ✅ Profile completed successfully')

    // ============================================================================
    // STEP 5: Log completion
    // ============================================================================
    try {
      await supabase
        .from('profile_changes')
        .insert({
          user_id: userId,
          changes: { profile_completed: true },
          changed_at: new Date().toISOString()
        })
        .catch(err => console.warn('[Profile Complete API] ⚠️ Failed to log completion:', err.message))
    } catch (err: any) {
      console.warn('[Profile Complete API] ⚠️ Audit logging error:', err.message)
    }

    // ============================================================================
    // STEP 6: Return success response
    // ============================================================================
    return {
      success: true,
      data: profile,
      message: 'Profile completed successfully'
    }

  } catch (err: any) {
    console.error('[Profile Complete API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while completing profile',
      data: { details: err.message }
    })
  }
})
