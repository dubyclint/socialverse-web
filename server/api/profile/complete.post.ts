// ============================================================================
// FILE: /server/api/profile/complete.post.ts - FIXED VERSION (NO INTERESTS COLUMN)
// ============================================================================
// Complete profile details - Phase 2 of progressive signup
// ✅ FIXED: Removed 'interests' from user_profiles update (separate table)
// ✅ FIXED: Uses event.context.user from auth middleware
// ✅ FIXED: Uses admin client for profile updates
// ✅ FIXED: Proper error handling and validation
// ============================================================================

interface CompleteProfileRequest {
  full_name: string
  bio: string
  avatar_url?: string
  location?: string
  website?: string
  date_of_birth?: string
  gender?: string
  interests?: string[]
  is_private?: boolean
  email_notifications?: boolean
}

interface CompleteProfileResponse {
  success: boolean
  profile?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<CompleteProfileResponse> => {
  console.log('[Profile/Complete API] ============ COMPLETE PROFILE START ============')

  try {
    // ============================================================================
    // STEP 1: Authentication - Get user from middleware context
    // ============================================================================
    console.log('[Profile/Complete API] STEP 1: Authenticating user...')
    
    const user = event.context.user
    
    if (!user || !user.id) {
      console.error('[Profile/Complete API] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
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
    // STEP 4: Update profile with completion data using ADMIN CLIENT
    // ============================================================================
    console.log('[Profile/Complete API] STEP 4: Updating profile with admin privileges...')

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    console.log('[Profile/Complete API] ✅ Admin client obtained')

    // ✅ FIXED: Removed 'interests' from update (it's a separate table)
    // ✅ Only update fields that exist in user_profiles table
    const { data: profiles, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        full_name: body.full_name.trim(),
        bio: body.bio.trim(),
        avatar_url: body.avatar_url || null,
        location: body.location?.trim() || null,
        website: body.website?.trim() || null,
        birth_date: body.date_of_birth || null,
        gender: body.gender || null,
        is_private: body.is_private || false,
        profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()

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

    if (!profiles || profiles.length === 0) {
      console.error('[Profile/Complete API] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    const profile = profiles[0]

    console.log('[Profile/Complete API] ✅ Profile updated successfully')
    console.log('[Profile/Complete API] Updated profile:', {
      id: profile.id,
      full_name: profile.full_name,
      profile_completed: profile.profile_completed
    })

    // ============================================================================
    // STEP 5: Handle interests separately (if provided)
    // ============================================================================
    if (body.interests && body.interests.length > 0) {
      console.log('[Profile/Complete API] STEP 5: Handling interests...')
      
      try {
        // ✅ NOTE: Interests are stored in a separate table/relationship
        // This is a placeholder for future interest storage implementation
        // For now, we just log that interests were provided
        console.log('[Profile/Complete API] ℹ️ Interests provided:', body.interests)
        console.log('[Profile/Complete API] ℹ️ Interest storage implementation needed')
        
        // TODO: Implement interest storage when the schema is ready
        // Example:
        // const { error: interestError } = await supabase
        //   .from('user_interests')
        //   .upsert(
        //     body.interests.map(interest => ({
        //       user_id: userId,
        //       interest_id: interest,
        //       created_at: new Date().toISOString()
        //     }))
        //   )
      } catch (interestError: any) {
        console.warn('[Profile/Complete API] ⚠️ Warning: Could not save interests:', interestError.message)
        // Don't fail the entire request if interests fail
      }
    }

    // ============================================================================
    // STEP 6: Return success response
    // ============================================================================
    console.log('[Profile/Complete API] STEP 6: Building response...')
    console.log('[Profile/Complete API] ✅ Profile completed successfully')
    console.log('[Profile/Complete API] ============ COMPLETE PROFILE END ============')

    return {
      success: true,
      profile: profile,
      message: 'Profile completed successfully'
    }

  } catch (err: any) {
    console.error('[Profile/Complete API] ============ COMPLETE PROFILE ERROR ============')
    console.error('[Profile/Complete API] Error type:', err?.constructor?.name)
    console.error('[Profile/Complete API] Error message:', err?.message)
    console.error('[Profile/Complete API] Error details:', err?.data || 'N/A')
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
