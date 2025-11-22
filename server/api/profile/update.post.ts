// FILE: /server/api/profile/update.post.ts - UPDATE
// Update user profile
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
  website?: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<UpdateProfileRequest>(event)

    // STEP 2: BUILD UPDATE OBJECT (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (body.firstName && body.lastName) {
      updateData.full_name = `${body.firstName} ${body.lastName}`
    }
    if (body.phone !== undefined) updateData.phone = body.phone || null
    if (body.bio !== undefined) updateData.bio = body.bio || null
    if (body.address !== undefined) updateData.location = body.address || null
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl || null
    if (body.website !== undefined) updateData.website = body.website || null

    // STEP 3: UPDATE PROFILE
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile'
      })
    }

    // STEP 4: RETURN SUCCESS
    return {
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    }

  } catch (error) {
    console.error('[UpdateProfile] Error:', error)
    throw error
  }
})
