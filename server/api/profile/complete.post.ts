// ============================================================================
// FILE: /server/api/profile/complete.post.ts - FIXED VERSION
// ============================================================================
// ✅ CRITICAL FIX: Now sets profile_completed = true
// ✅ CRITICAL FIX: Returns profile with profile_completed flag
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

    const body = await readBody<CompleteProfileRequest>(event)
    console.log('[Profile/Complete API] Completion data:', {
      full_name: body.full_name,
      bio: body.bio,
      interests: body.interests?.length || 0
    })

    // Validate required fields
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

    if (validationErrors.length > 0) {
      console.error('[Profile/Complete API] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: validationErrors[0]
      })
    }

    console.log('[Profile/Complete API] ✅ Validation passed')

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    console.log('[Profile/Complete API] ✅ Admin client obtained')

    // ✅ CRITICAL FIX: Update profile with profile_completed = true
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
        profile_completed: true,  // ✅ CRITICAL: Set to true
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('[Profile/Complete API] ❌ Update error:', updateError.message)
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
    console.log('[Profile/Complete API] ✅ profile_completed set to:', profile.profile_completed)

    // ✅ NEW: Save interests if provided
    if (body.interests && body.interests.length > 0) {
      console.log('[Profile/Complete API] Saving interests...')
      
      try {
        if (body.interests.length > 5) {
          console.warn('[Profile/Complete API] ⚠️ More than 5 interests, truncating to 5')
          body.interests = body.interests.slice(0, 5)
        }

        // Remove all existing interests
        await supabase.rpc('remove_all_user_interests', { p_user_id: userId })

        // Add new interests
        const { data: interestResult, error: interestError } = await supabase
          .rpc('add_user_interests', {
            p_user_id: userId,
            p_interest_names: body.interests
          })

        if (interestError) {
          console.warn('[Profile/Complete API] ⚠️ Failed to save interests:', interestError.message)
        } else {
          console.log('[Profile/Complete API] ✅ Interests saved:', interestResult)
        }
      } catch (interestError: any) {
        console.warn('[Profile/Complete API] ⚠️ Interest save error:', interestError.message)
        // Don't fail profile completion if interests fail
      }
    }

    console.log('[Profile/Complete API] ✅ Profile completed successfully')
    console.log('[Profile/Complete API] ============ COMPLETE PROFILE END ============')

    return {
      success: true,
      profile: profile,
      message: 'Profile completed successfully'
    }

  } catch (err: any) {
    console.error('[Profile/Complete API] ============ COMPLETE PROFILE ERROR ============')
    console.error('[Profile/Complete API] Error message:', err?.message)
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
