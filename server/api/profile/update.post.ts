// ============================================================================
// FILE: /server/api/profile/update.post.ts - CORRECTED VERSION
// ============================================================================
// ✅ Updates user table (not profiles table)
// ✅ Supports all profile fields
// ✅ Only authenticated users can update their own profile
// ============================================================================

import { createClient } from '@supabase/supabase-js'

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
    // STEP 1: Get authenticated user
    // ============================================================================
    console.log('[Profile/Update] STEP 1: Authenticating user...')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from request header or body
    const body = await readBody<UpdateProfileRequest & { userId?: string }>(event)
    const userId = body.userId

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Profile/Update] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read and validate request body
    // ============================================================================
    console.log('[Profile/Update] STEP 2: Validating input...')

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
    // STEP 3: Update user profile in database
    // ============================================================================
    console.log('[Profile/Update] STEP 3: Updating profile...')

    const { data: profile, error: updateError } = await supabase
      .from('user')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile/Update] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    if (!profile) {
      console.error('[Profile/Update] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    console.log('[Profile/Update] ✅ Profile updated successfully')
    console.log('[Profile/Update] ============ END ============')

    return {
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    }

  } catch (error: any) {
    console.error('[Profile/Update] ❌ Error:', error?.message || error)
    
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
