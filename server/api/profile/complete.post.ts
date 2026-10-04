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
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnProfile } from '~/server/utils/own-profile'
import { changeUsername, normaliseUsername } from '~/server/utils/username-change'

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
  phone_country?: string
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
    
    const trimmed = (value: string | null | undefined): string | null =>
      typeof value === 'string' ? value.trim() : null

    // Username and phone keep their own rules (history, uniqueness, verification).
    const existing = await loadOwnProfile(userId)
    if (body.username && existing && normaliseUsername(body.username) !== existing.username) {
      if (existing.profile_completed) {
        throw createError({ statusCode: 409, statusMessage: 'Change your username from Edit profile' })
      }
      await changeUsername(userId, normaliseUsername(body.username))
    }
    const phoneCountry = body.phone_country?.trim().toUpperCase() || existing?.phone_country
    if (body.phone?.trim()) {
      if (!phoneCountry) throw createError({ statusCode: 400, statusMessage: 'Select your country code' })
      const { error: phoneError } = await getServiceClient().rpc('set_user_phone', {
        p_user: userId,
        p_raw: body.phone.trim(),
        p_country: phoneCountry
      })
      if (phoneError) throw createError({ statusCode: 500, statusMessage: phoneError.message })
    }
    if (displayName !== null) updatePayload.display_name = trimmed(displayName)
    if (body.bio !== undefined) updatePayload.bio = trimmed(body.bio)
    if (body.avatar_url !== undefined) updatePayload.avatar_url = body.avatar_url
    if (body.cover_url !== undefined) updatePayload.cover_url = body.cover_url
    if (body.website !== undefined) updatePayload.website = trimmed(body.website)
    if (body.location !== undefined) updatePayload.location = trimmed(body.location)
    if (body.birth_date !== undefined) updatePayload.birth_date = body.birth_date
    if (body.gender !== undefined) updatePayload.gender = body.gender
    
    updatePayload.profile_completed = true
    updatePayload.updated_at = new Date().toISOString()

    console.log('[Profile Complete API] ✅ Payload prepared:', Object.keys(updatePayload))

    // ============================================================================
    // STEP 4: Update the existing 'user' row
    // ============================================================================
    // Signup always provisions the row, so this is an update: an upsert would
    // have to satisfy the NOT NULL columns this payload deliberately omits.

    console.log('[Profile Complete API] Updating user table...')

    const { data: profile, error: upsertError } = await supabase
      .from('user')
      .update(updatePayload)
      .eq('user_id', userId)
      .select('user_id')
      .single()

    if (upsertError) {
      console.error('[Profile Complete API] ❌ Update error:', upsertError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to complete profile: ' + upsertError.message
      })
    }

    const completed = profile ? await loadOwnProfile(userId) : null
    if (!completed) {
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
      profile: completed,
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


