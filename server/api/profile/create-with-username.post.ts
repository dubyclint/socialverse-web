// ============================================================================
// CORRECTED FIX #6: /server/api/profile/create-with-username.post.ts
// ============================================================================
// Create/update username during profile completion with auto-generation
// ✅ FIXED: Changed 'user' table to 'user_profiles' (ACTUAL TABLE)
// ✅ FIXED: Changed 'user_id' to 'id' (correct column name)
// ✅ FIXED: Proper error handling and validation
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface CreateUsernameRequest {
  username: string
}

interface CreateUsernameResponse {
  success: boolean
  message: string
  username: string
  wasModified: boolean
}

export default defineEventHandler(async (event): Promise<CreateUsernameResponse> => {
  console.log('[CreateUsername API] ============ CREATE USERNAME START ============')

  try {
    // ============================================================================
    // STEP 1: Verify authentication
    // ============================================================================
    console.log('[CreateUsername API] STEP 1: Verifying authentication...')

    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    if (!userId) {
      console.error('[CreateUsername API] ❌ Unauthorized - No user ID')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    console.log('[CreateUsername API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read and validate request body
    // ============================================================================
    console.log('[CreateUsername API] STEP 2: Reading request body...')

    const body = await readBody<CreateUsernameRequest>(event)

    if (!body.username || typeof body.username !== 'string') {
      console.error('[CreateUsername API] ❌ Username is required')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      })
    }

    const trimmedUsername = body.username.trim()
    console.log('[CreateUsername API] ✅ Username provided:', trimmedUsername)

    // ============================================================================
    // STEP 3: Validate username format
    // ============================================================================
    console.log('[CreateUsername API] STEP 3: Validating username format...')

    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      console.error('[CreateUsername API] ❌ Username length invalid')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username must be 3-30 characters'
      })
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      console.error('[CreateUsername API] ❌ Username format invalid')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    }

    console.log('[CreateUsername API] ✅ Username format valid')

    // ============================================================================
    // STEP 4: Generate unique username (auto-add suffix if taken)
    // ============================================================================
    console.log('[CreateUsername API] STEP 4: Generating unique username...')

    const generateSuffix = (): string => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let suffix = ''
      for (let i = 0; i < 3; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return suffix
    }

    let finalUsername = trimmedUsername.toLowerCase()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      console.log('[CreateUsername API] Checking username availability:', finalUsername)

      // ✅ FIXED: Changed from 'user' to 'user_profiles' table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('username', finalUsername)
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows found - username is available
        console.log('[CreateUsername API] ✅ Username is available:', finalUsername)
        break
      }

      if (!data) {
        console.log('[CreateUsername API] ✅ Username is available:', finalUsername)
        break
      }

      // Username taken, append random suffix
      console.log('[CreateUsername API] ⚠️ Username taken, generating new one...')
      finalUsername = `${trimmedUsername.toLowerCase()}${generateSuffix()}`
      attempts++
    }

    if (attempts >= maxAttempts) {
      console.error('[CreateUsername API] ❌ Could not generate unique username after', maxAttempts, 'attempts')
      throw createError({
        statusCode: 400,
        statusMessage: 'Could not generate unique username'
      })
    }

    console.log('[CreateUsername API] ✅ Final username:', finalUsername)

    // ============================================================================
    // STEP 5: Update profile with final username
    // ============================================================================
    console.log('[CreateUsername API] STEP 5: Updating profile with username...')

    // ✅ FIXED: Changed from 'user' to 'user_profiles' table
    // ✅ FIXED: Changed from 'user_id' to 'id' column
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        username: finalUsername
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[CreateUsername API] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update username: ' + updateError.message
      })
    }

    if (!updatedProfile) {
      console.error('[CreateUsername API] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    console.log('[CreateUsername API] ✅ Profile updated successfully')
    console.log('[CreateUsername API] ============ CREATE USERNAME END ============')

    return {
      success: true,
      message: 'Username created successfully',
      username: finalUsername,
      wasModified: finalUsername !== trimmedUsername.toLowerCase()
    }

  } catch (error: any) {
    console.error('[CreateUsername API] ============ CREATE USERNAME ERROR ============')
    console.error('[CreateUsername API] Error:', error.message)
    console.error('[CreateUsername API] ============ END ERROR ============')
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'An error occurred while creating username'
    })
  }
})
