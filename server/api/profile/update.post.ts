// FILE: /server/api/profile/update.post.ts - FIXED FOR PROFILES VIEW
// ============================================================================
// Update user profile
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UpdateProfileRequest {
  full_name?: string
  username?: string
  bio?: string
  avatar_url?: string
}

export default defineEventHandler(async (event) => {
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
    if (body.full_name && body.full_name.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Full name must be less than 100 characters'
      })
    }

    if (body.bio && body.bio.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bio must be less than 500 characters'
      })
    }

    if (body.username) {
      if (!/^[a-z0-9_-]+$/i.test(body.username)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
        })
      }

      if (body.username.length < 3 || body.username.length > 30) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username must be between 3 and 30 characters'
        })
      }

      // Check if username is taken by another user
      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('user_id')
        .eq('username', body.username.toLowerCase())
        .neq('user_id', userId)
        .single()

      if (existingUser) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username already taken'
        })
      }
    }

    // ============================================================================
    // STEP 4: Update profile
    // ============================================================================
    console.log('[Profile Update API] Updating profile...')

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.full_name) updateData.full_name = body.full_name
    if (body.username) updateData.username = body.username.toLowerCase()
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Profile Update API] ❌ Update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile',
        data: { details: updateError.message }
      })
    }

    console.log('[Profile Update API] ✅ Profile updated successfully')

    return {
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    }

  } catch (err: any) {
    console.error('[Profile Update API] ❌ Error:', err)

    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update profile',
      data: { details: err.message }
    })
  }
})
