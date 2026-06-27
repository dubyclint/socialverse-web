import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const authUserId = event.context.user?.id || event.context.user?.user_id || null

    if (!authUserId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // ✅ Query the 'user' table with correct column mapping
    const { data, error } = await supabase
      .from('user')
      .select('user_id,username,email,display_name,full_name,bio,avatar_url,cover_url,website,location,birth_date,gender,phone,profile_completed,is_verified,is_private,rank,rank_points,rank_level,followers_count,following_count,posts_count,created_at,updated_at,last_seen')
      .eq('user_id', authUserId)
      .maybeSingle()

    if (error) {
      console.error('[GET /api/profile/me] db error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile'
      })
    }

    // ✅ If no user exists, return null (frontend will redirect to /profile/complete)
    if (!data) {
      return null
    }

    // ✅ Map database columns to frontend-expected format using withAlias logic
    return {
      ...data,
      id: data.user_id,  // Alias for frontend compatibility
      full_name: data.display_name  // Map display_name to full_name
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[GET /api/profile/me] internal error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})

