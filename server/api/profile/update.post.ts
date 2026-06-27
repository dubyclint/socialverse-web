// FILE: /server/api/profile/update.post.ts
// CORRECTED VERSION

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const updateData: any = {}

    // Only include fields that are provided
    if (body.username !== undefined) updateData.username = body.username
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
    if (body.cover_url !== undefined) updateData.cover_url = body.cover_url
    if (body.website !== undefined) updateData.website = body.website
    if (body.location !== undefined) updateData.location = body.location

    updateData.updated_at = new Date().toISOString()

    // ✅ FIXED: Changed from 'profiles' to 'user'
    const { data, error } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + error.message
      })
    }

    return {
      success: true,
      profile: data
    }

  } catch (error: any) {
    console.error('Profile update API error:', error)
    throw error
  }
})
