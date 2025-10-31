// /server/api/profile/complete.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface CompleteProfileRequest {
  firstName: string
  lastName: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
  interests: string[] // array of interest IDs
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<CompleteProfileRequest>(event)

    // Validate required fields
    if (!body.firstName || !body.lastName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'First name and last name are required'
      })
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: body.firstName,
        last_name: body.lastName,
        phone_number: body.phone || null,
        bio: body.bio || null,
        address: body.address || null,
        avatar_url: body.avatarUrl || null,
        profile_completed: true
      })
      .eq('user_id', userId)

    if (profileError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to update profile'
      })
    }

    // Add interests
    if (body.interests && body.interests.length > 0) {
      const interestInserts = body.interests.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }))

      const { error: interestError } = await supabase
        .from('user_interests')
        .insert(interestInserts)

      if (interestError) {
        console.warn('Interest insertion warning:', interestError)
      }
    }

    return {
      success: true,
      message: 'Profile completed successfully'
    }
  } catch (error) {
    console.error('[Complete Profile] Error:', error)
    throw error
  }
})
