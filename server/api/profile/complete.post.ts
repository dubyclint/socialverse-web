// FILE: /server/api/profile/complete.post.ts
// ============================================================================
// PROFILE COMPLETION ENDPOINT - CORRECTED VERSION
// ============================================================================
// ✅ Uses 'user' table directly (NOT the profiles view)
// ✅ Proper column naming (user_id, display_name)
// ✅ UPSERT logic for both new and existing profiles
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

interface CompleteProfileRequest {
  username?: string
  display_name?: string
  full_name?: string  // Maps to display_name
  bio?: string
  avatar_url?: string
  cover_url?: string
  website?: string
  location?: string
  birth_date?: string
  gender?: string
  phone?: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    console.log('[Profile Complete API] Processing profile completion...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('[Profile Complete API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = user.id
    console.log('[Profile Complete API] User ID:', userId)

    // ============================================================================
    // STEP 2: Read and validate request body
    // ============================================================================
    const body = await readBody<CompleteProfileRequest>(event)
    
    // Validate username if provided
    if (body.username && body.username.trim().length < 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be at least 3 characters'
      })
    }

    if (body.username && body.username.trim().length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must not exceed 30 characters'
      })
    }

    // Validate bio if provided
    if (body.bio && body.bio.trim().length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bio must not exceed 500 characters'
      })
    }

    // ============================================================================
    // STEP 3: Prepare update payload
    // ============================================================================
    // Map full_name to display_name for database consistency
    const displayName = body.display_name || body.full_name || null
    
    const updatePayload: Record<string, any> = {}
    
    if (body.username !== undefined) updatePayload.username = body.username.trim()
    if (displayName !== undefined && displayName !== null) updatePayload.display_name = displayName.trim()
    if (body.bio !== undefined) updatePayload.bio = body.bio.trim()
    if (body.avatar_url !== undefined) updatePayload.avatar_url = body.avatar_url
    if (body.cover_url !== undefined) updatePayload.cover_url = body.cover_url
    if (body.website !== undefined) updatePayload.website = body.website.trim()
    if (body.location !== undefined) updatePayload.location = body.location.trim()
    if (body.birth_date !== undefined) updatePayload.birth_date = body.birth_date
    if (body.gender !== undefined) updatePayload.gender = body.gender
    if (body.phone !== undefined) updatePayload.phone = body.phone
    
    updatePayload.profile_completed = true
    updatePayload.updated_at = new Date().toISOString()

    console.log('[Profile Complete API] ✅ Payload prepared:', Object.keys(updatePayload))

    // ============================================================================
    // STEP 4: UPSERT profile directly to 'user' table
    // ============================================================================
    // Use UPSERT to:
    // - Create profile if it doesn't exist
    // - Update profile if it already exists
    
    console.log('[Profile Complete API] Upserting profile to user table...')

    const { data: profile, error: upsertError } = await supabase
      .from('user')
      .upsert(
        {
          user_id: userId,
          ...updatePayload
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )
      .select('*')
      .single()

    if (upsertError) {
      console.error('[Profile Complete API] ❌ Upsert error:', upsertError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to complete profile: ' + upsertError.message
      })
    }

    if (!profile) {
      console.error('[Profile Complete API] ❌ No profile returned after upsert')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile upsert returned no data'
      })
    }

    console.log('[Profile Complete API] ✅ Profile completed successfully')

    // ============================================================================
    // STEP 5: Return response with proper field mapping
    // ============================================================================
    return {
      success: true,
      profile: {
        ...profile,
        id: profile.user_id,  // Alias for frontend compatibility
        full_name: profile.display_name  // Map display_name to full_name
      },
      message: 'Profile completed successfully'
    }

  } catch (error: any) {
    console.error('[Profile Complete API] ❌ Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while completing profile',
      data: { details: error.message }
    })
  }
})


