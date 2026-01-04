// ============================================================================
// FILE: /server/api/profile/update.post.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Update user profile with all fields including interests and custom data
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UpdateProfileRequest {
  full_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  interests?: string[]
  colors?: Record<string, any>
  items?: string[]
}

interface UpdateProfileResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<UpdateProfileResponse> => {
  console.log('[Profile/Update API] ============ UPDATE PROFILE START ============')

  try {
    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    console.log('[Profile/Update API] STEP 1: Authenticating user...')
    
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Profile/Update API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Profile/Update API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    console.log('[Profile/Update API] STEP 2: Reading request body...')
    
    const body = await readBody<UpdateProfileRequest>(event)
    console.log('[Profile/Update API] Update data:', {
      full_name: body.full_name,
      bio: body.bio,
      location: body.location,
      website: body.website,
      interests: body.interests?.length || 0,
      hasColors: !!body.colors,
      hasItems: !!body.items
    })

    // ============================================================================
    // STEP 3: Validate input
    // ============================================================================
    console.log('[Profile/Update API] STEP 3: Validating input...')
    
    const updates: any = {}
    const validationErrors: string[] = []

    // Validate and sanitize full_name
    if (body.full_name !== undefined) {
      if (body.full_name.length > 100) {
        validationErrors.push('Full name must be less than 100 characters')
      } else {
        updates.full_name = body.full_name.trim()
      }
    }

    // Validate and sanitize bio
    if (body.bio !== undefined) {
      if (body.bio.length > 500) {
        validationErrors.push('Bio must be less than 500 characters')
      } else {
        updates.bio = body.bio.trim()
      }
    }

    // Validate and sanitize location
    if (body.location !== undefined) {
      if (body.location.length > 100) {
        validationErrors.push('Location must be less than 100 characters')
      } else {
        updates.location = body.location.trim()
      }
    }

    // Validate and sanitize website
    if (body.website !== undefined) {
      if (body.website.length > 255) {
        validationErrors.push('Website must be less than 255 characters')
      } else {
        updates.website = body.website.trim()
      }
    }

    // Validate avatar_url
    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url
    }

    // Validate interests
    if (body.interests !== undefined) {
      if (!Array.isArray(body.interests)) {
        validationErrors.push('Interests must be an array')
      } else {
        updates.interests = body.interests
      }
    }

    // Validate colors
    if (body.colors !== undefined) {
      if (typeof body.colors !== 'object') {
        validationErrors.push('Colors must be an object')
      } else {
        updates.colors = body.colors
      }
    }

    // Validate items
    if (body.items !== undefined) {
      if (!Array.isArray(body.items)) {
        validationErrors.push('Items must be an array')
      } else {
        updates.items = body.items
      }
    }

    if (validationErrors.length > 0) {
      console.error('[Profile/Update API] ❌ Validation failed:', validationErrors)
      throw createError({
        statusCode: 400,
        statusMessage: validationErrors[0]
      })
    }

    // Add timestamp
    updates.updated_at = new Date().toISOString()

    console.log('[Profile/Update API] ✅ Validation passed')

    // ============================================================================
    // STEP 4: Update profile
    // ============================================================================
    console.log('[Profile/Update API] STEP 4: Updating profile...')

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile/Update API] ❌ Update error:', {
        message: updateError.message,
        code: updateError.code
      })
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    if (!profile) {
      console.error('[Profile/Update API] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    console.log('[Profile/Update API] ✅ Profile updated successfully')
    console.log('[Profile/Update API] Updated fields:', Object.keys(updates))

    // ============================================================================
    // STEP 5: Log change for audit trail
    // ============================================================================
    console.log('[Profile/Update API] STEP 5: Logging changes...')
    
    try {
      await supabase
        .from('profile_changes')
        .insert({
          user_id: userId,
          changes: updates,
          changed_at: new Date().toISOString()
        })
        .catch(err => console.warn('[Profile/Update API] ⚠️ Failed to log change:', err.message))
    } catch (err: any) {
      console.warn('[Profile/Update API] ⚠️ Audit logging error:', err.message)
    }

    // ============================================================================
    // STEP 6: Return success response
    // ============================================================================
    console.log('[Profile/Update API] STEP 6: Building response...')
    console.log('[Profile/Update API] ✅ Profile updated successfully')
    console.log('[Profile/Update API] ============ UPDATE PROFILE END ============')

    return {
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    }

  } catch (err: any) {
    console.error('[Profile/Update API] ============ UPDATE PROFILE ERROR ============')
    console.error('[Profile/Update API] Error:', err.message)
    console.error('[Profile/Update API] ============ END ERROR ============')
    
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
