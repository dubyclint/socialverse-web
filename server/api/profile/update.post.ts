// ============================================================================
// FILE: /server/api/profile/update.post.ts - FIXED VERSION
// ============================================================================
// ✅ FIXED: Uses user_profiles table (consistent with other endpoints)
// ✅ FIXED: Uses admin client with service role key
// ✅ FIXED: Proper error handling and validation
// ============================================================================

interface UpdateProfileRequest {
  full_name?: string
  bio?: string
  avatar_url?: string
  cover_url?: string
  website?: string
  location?: string
  birth_date?: string
  gender?: string
  phone?: string
  is_private?: boolean
}

interface UpdateProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<UpdateProfileResponse> => {
  try {
    console.log('[Profile/Update] ============ START ============')

    // ============================================================================
    // STEP 1: Get authenticated user from middleware context
    // ============================================================================
    console.log('[Profile/Update] STEP 1: Authenticating user...')
    
    const user = event.context.user
    
    if (!user || !user.id) {
      console.error('[Profile/Update] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
    console.log('[Profile/Update] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read and validate request body
    // ============================================================================
    console.log('[Profile/Update] STEP 2: Reading request body...')

    const body = await readBody<UpdateProfileRequest>(event)
    const updates: any = {}
    const validationErrors: string[] = []

    // Validate full_name
    if (body.full_name !== undefined) {
      if (body.full_name && body.full_name.length > 100) {
        validationErrors.push('Full name must be less than 100 characters')
      } else {
        updates.full_name = body.full_name?.trim() || null
      }
    }

    // Validate bio
    if (body.bio !== undefined) {
      if (body.bio && body.bio.length > 500) {
        validationErrors.push('Bio must be less than 500 characters')
      } else {
        updates.bio = body.bio?.trim() || null
      }
    }

    // Validate avatar_url
    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url || null
    }

    // Validate cover_url
    if (body.cover_url !== undefined) {
      updates.cover_url = body.cover_url || null
    }

    // Validate website
    if (body.website !== undefined) {
      if (body.website && body.website.length > 255) {
        validationErrors.push('Website must be less than 255 characters')
      } else {
        updates.website = body.website?.trim() || null
      }
    }

    // Validate location
    if (body.location !== undefined) {
      if (body.location && body.location.length > 100) {
        validationErrors.push('Location must be less than 100 characters')
      } else {
        updates.location = body.location?.trim() || null
      }
    }

    // Validate birth_date
    if (body.birth_date !== undefined) {
      updates.birth_date = body.birth_date || null
    }

    // Validate gender
    if (body.gender !== undefined) {
      updates.gender = body.gender || null
    }

    // Validate phone
    if (body.phone !== undefined) {
      if (body.phone && body.phone.length > 20) {
        validationErrors.push('Phone must be less than 20 characters')
      } else {
        updates.phone = body.phone?.trim() || null
      }
    }

    // Validate is_private
    if (body.is_private !== undefined) {
      updates.is_private = body.is_private
    }

    if (validationErrors.length > 0) {
      console.error('[Profile/Update] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: validationErrors[0]
      })
    }

    // Add timestamp
    updates.updated_at = new Date().toISOString()

    console.log('[Profile/Update] ✅ Validation passed')
    console.log('[Profile/Update] Fields to update:', Object.keys(updates))

    // ============================================================================
    // STEP 3: Update user profile in database using ADMIN CLIENT
    // ============================================================================
    console.log('[Profile/Update] STEP 3: Updating profile with admin privileges...')

    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    console.log('[Profile/Update] ✅ Admin client obtained')

    // ✅ FIXED: Use user_profiles table (consistent with other endpoints)
    const { data: profiles, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()

    if (updateError) {
      console.error('[Profile/Update] ❌ Update error:', updateError.message)
      console.error('[Profile/Update] Error details:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    if (!profiles || profiles.length === 0) {
      console.error('[Profile/Update] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile not found - user may not have a profile record'
      })
    }

    const profile = profiles[0]

    console.log('[Profile/Update] ✅ Profile updated successfully')
    console.log('[Profile/Update] Updated fields:', Object.keys(updates))
    console.log('[Profile/Update] ============ END ============')

    return {
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    }

  } catch (error: any) {
    console.error('[Profile/Update] ============ ERROR ============')
    console.error('[Profile/Update] Error type:', error?.constructor?.name)
    console.error('[Profile/Update] Error message:', error?.message)
    console.error('[Profile/Update] Error details:', error?.data || 'N/A')
    console.error('[Profile/Update] ============ END ERROR ============')
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while updating profile',
      data: { details: error.message }
    })
  }
})

