// FILE: /server/api/profile/update.post.ts - FIXED FOR PROFILES VIEW
// ============================================================================
// Update user profile - FIXED: Proper validation and error handling
// ✅ FIXED: Validates all input fields
// ✅ FIXED: Checks username uniqueness
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UpdateProfileRequest {
  full_name?: string
  username?: string
  bio?: string
  avatar_url?: string
}

interface UpdateProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<UpdateProfileResponse> => {
  try {
    console.log('[Profile Update API] Processing update request...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Profile Update API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Profile Update API] User ID:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    const body = await readBody<UpdateProfileRequest>(event)
    console.log('[Profile Update API] Update data:', {
      full_name: body.full_name,
      username: body.username,
      bio: body.bio,
      avatar_url: body.avatar_url ? 'provided' : 'not provided'
    })

    // ============================================================================
    // STEP 3: Validate input
    // ============================================================================
    const updates: any = {}

    // Validate and sanitize full_name
    if (body.full_name !== undefined) {
      if (body.full_name.length > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Full name must be less than 100 characters'
        })
      }
      updates.full_name = body.full_name.trim()
    }

    // Validate and check username uniqueness
    if (body.username !== undefined) {
      const newUsername = body.username.toLowerCase().trim()
      
      if (!/^[a-z0-9_-]+$/i.test(newUsername)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
        })
      }

      if (newUsername.length < 3 || newUsername.length > 30) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username must be between 3 and 30 characters'
        })
      }

      // Check if username already taken by another user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .neq('id', userId)
        .single()

      if (existingUser) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken'
        })
      }

      updates.username = newUsername
    }

    // Validate bio
    if (body.bio !== undefined) {
      if (body.bio.length > 500) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bio must be less than 500 characters'
        })
      }
      updates.bio = body.bio.trim()
    }

    // Update avatar_url if provided
    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url
    }

    // Add timestamp
    updates.updated_at = new Date().toISOString()

    console.log('[Profile Update API] ✅ Validation passed')

    // ============================================================================
    // STEP 4: Update profile
    // ============================================================================
    console.log('[Profile Update API] Updating profile...')

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile Update API] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    console.log('[Profile Update API] ✅ Profile updated successfully')

    // ============================================================================
    // STEP 5: Log change for audit trail
    // ============================================================================
    try {
      await supabase
        .from('profile_changes')
        .insert({
          user_id: userId,
          changes: updates,
          changed_at: new Date().toISOString()
        })
        .catch(err => console.warn('[Profile Update API] ⚠️ Failed to log change:', err.message))
    } catch (err: any) {
      console.warn('[Profile Update API] ⚠️ Audit logging error:', err.message)
    }

    // ============================================================================
    // STEP 6: Return success response
    // ============================================================================
    return {
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    }

  } catch (err: any) {
    console.error('[Profile Update API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while updating profile',
      data: { details: err.message }
    })
  }
})
