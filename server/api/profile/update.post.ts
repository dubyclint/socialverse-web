// /server/api/profile/update.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
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

    const body = await readBody<UpdateProfileRequest>(event)

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (body.firstName) updateData.first_name = body.firstName
    if (body.lastName) updateData.last_name = body.lastName
    if (body.phone !== undefined) updateData.phone_number = body.phone
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.address !== undefined) updateData.address = body.address
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)

    if (updateError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to update profile'
      })
    }

    return {
      success: true,
      message: 'Profile updated successfully'
    }
  } catch (error) {
    console.error('[Update Profile] Error:', error)
    throw error
  }
})
