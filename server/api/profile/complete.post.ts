// FILE: /server/api/profile/complete.post.ts - UPDATE
// Complete user profile after email verification
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface CompleteProfileRequest {
  firstName: string
  lastName: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
  interests: string[]
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

    const body = await readBody<CompleteProfileRequest>(event)

    // STEP 2: VALIDATE REQUIRED FIELDS
    if (!body.firstName || !body.lastName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'First name and last name are required'
      })
    }

    if (!body.interests || body.interests.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'At least one interest must be selected'
      })
    }

    // STEP 3: UPDATE PROFILES TABLE
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: `${body.firstName} ${body.lastName}`,
        phone: body.phone || null,
        bio: body.bio || null,
        location: body.address || null,
        avatar_url: body.avatarUrl || null,
        profile_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile'
      })
    }

    // STEP 4: LINK INTERESTS (Many-to-Many)
    // First delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)

    // Then insert new interests
    const interestInserts = body.interests.map(interestId => ({
      user_id: userId,
      interest_id: interestId
    }))

    const { error: interestError } = await supabase
      .from('user_interests')
      .insert(interestInserts)

    if (interestError) {
      console.warn('[CompleteProfile] Interest linking warning:', interestError)
      // Don't fail if interests fail
    }

    // STEP 5: FETCH UPDATED PROFILE
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // STEP 6: RETURN SUCCESS
    return {
      success: true,
      message: 'Profile completed successfully',
      nextStep: 'dashboard',
      profile: updatedProfile
    }

  } catch (error) {
    console.error('[CompleteProfile] Error:', error)
    throw error
  }
})
