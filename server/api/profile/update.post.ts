// FILE: /server/api/profile/update.post.ts
// CORRECTED VERSION

import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

type UserUpdate = Database['public']['Tables']['user']['Update']

// Postgres rejects '' for date/uuid columns; the edit form sends it for cleared fields.
const nullIfBlank = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient<Database>(event)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const updateData: UserUpdate = {}

    // Only include fields that are provided
    if (body.username !== undefined) updateData.username = body.username
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
    if (body.cover_url !== undefined) updateData.cover_url = body.cover_url
    if (body.website !== undefined) updateData.website = body.website
    if (body.location !== undefined) updateData.location = body.location
    if (body.birth_date !== undefined) updateData.birth_date = nullIfBlank(body.birth_date)
    if (body.gender !== undefined) updateData.gender = nullIfBlank(body.gender)
    if (body.is_private !== undefined) updateData.is_private = body.is_private

    // The edit form calls it full_name; display_name is what the feed and
    // profile cards read, so keep the two in step.
    const name = body.full_name ?? body.display_name
    if (name !== undefined) {
      updateData.full_name = name
      updateData.display_name = name
    }

    updateData.updated_at = new Date().toISOString()

    // ✅ FIXED: Changed from 'profiles' to 'user'
    const { data, error } = await supabase
      .from('user')
      .update(updateData)
      .eq('user_id', user.id)
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
