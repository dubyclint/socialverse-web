// ============================================================================
// FILE 8: /server/api/profile/complete.post.ts - CORRECTED
// ============================================================================
// ✅ UPDATED: Changed 'profiles' table to 'user' table
// ============================================================================

// FILE: /server/api/profile/complete.post.ts - COMPLETE UPDATED VERSION
// Complete profile details - Phase 2 of progressive signup
// ✅ CHANGED: Queries 'user' table instead of 'profiles'

import { serverSupabaseClient } from '#supabase/server'

interface CompleteProfileRequest {
  full_name: string
  bio: string
  avatar_url?: string
  location?: string
  website?: string
  interests?: string[]
}

interface CompleteProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<CompleteProfileResponse> => {
  console.log('[Profile/Complete API] ============ COMPLETE PROFILE START ============')

  try {
    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    console.log('[Profile/Complete API] STEP 1: Authenticating user...')
    
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Profile/Complete API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Profile/Complete API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    console.log('[Profile/Complete API] STEP 2: Reading request body...')
    
    const body = await readBody<CompleteProfileRequest>(event)
    console.log('[Profile/Complete API] Completion data:', {
      full_name: body.full_name,
      bio: body.bio,
      location: body.location,
      website: body.website,
      interests: body.interests?.length || 0
    })

    // ============================================================================
    // STEP 3: Validate required fields
    // ============================================================================
    console.log('[Profile/Complete API] STEP 3: Validating required fields...')
    
    const validationErrors: string[] = []

    if (!body.full_name || body.full_name.trim().length === 0) {
      validationErrors.push('Full name is required')
    }

    if (!body.bio || body.bio.trim().length === 0) {
      validationErrors.push('Bio is required')
    }

    if (body.full_name && body.full_name.length > 100) {
      validationErrors.push('Full name must be less than 100 characters')
    }

    if (body.bio && body.bio.length > 500) {
      validationErrors.push('Bio must be less than 500 characters')
    }

    if (body.location && body.location.length > 100) {
      validationErrors.push('Location must be less than 100 characters')
    }

    if (body.website && body.website.length > 255) {
      validationErrors.push('Website must be less than 255 characters')
    }

    if (validationErrors.length > 0) {
      console.error('[Profile/Complete API] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: validationErrors[0]
      })
    }

    console.log('[Profile/Complete API] ✅ Validation passed')

    // ============================================================================
    // STEP 4: Update profile with completion flag
    // ============================================================================
    console.log('[Profile/Complete API] STEP 4: Updating profile...')

    // ✅ CHANGED: from 'profiles' to 'user'
    const { data: profile, error: updateError } = await supabase
      .from('user')
      .update({
        full_name: body.full_name.trim(),
        bio: body.bio.trim(),
        avatar_url: body.avatar_url || null,
        location: body.location?.trim() || null,
        website: body.website?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile/Complete API] ❌ Update error:', {
        message: updateError.message,
        code: updateError.code
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to complete profile: ' + updateError.message
      })
    }

    if (!profile) {
      console.error('[Profile/Complete API] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    console.log('[Profile/Complete API] ✅ Profile updated successfully')
    console.log('[Profile/Complete API] Updated profile:', {
      user_id: profile.user_id,
      full_name: profile.full_name
    })

    // ============================================================================
    // STEP 5: Return success response
    // ============================================================================
    console.log('[Profile/Complete API] STEP 5: Building response...')
    console.log('[Profile/Complete API] ✅ Profile completed successfully')
    console.log('[Profile/Complete API] ============ COMPLETE PROFILE END ============')

    return {
      success: true,
      data: profile,
      message: 'Profile completed successfully'
    }

  } catch (err: any) {
    console.error('[Profile/Complete API] ============ COMPLETE PROFILE ERROR ============')
    console.error('[Profile/Complete API] Error:', err.message)
    console.error('[Profile/Complete API] ============ END ERROR ============')
    
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
