// ============================================================================
// COMPLETE FIX: /server/api/users/suggested.get.ts
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 5, 20)

    const supabase = await serverSupabaseClient(event)

    const { data: suggestedUsers, error } = await supabase
      .from('users')
      .select('id, name, username, avatar_url, bio')
      .neq('id', user.id)
      .is('deleted_at', null)
      .limit(limit)

    if (error) {
      console.error('[Suggested Users API] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch suggested users'
      })
    }

    const formatted = (suggestedUsers || []).map((u: any) => ({
      id: u.id,
      name: u.name || 'Unknown',
      username: u.username || 'unknown',
      avatar: u.avatar_url || '/default-avatar.svg',
      bio: u.bio || '',
      followers: 0,
      isFollowing: false
    }))

    return {
      success: true,
      data: formatted,
      total: formatted.length
    }

  } catch (error: any) {
    console.error('[Suggested Users API] Error:', error.message)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch suggested users'
    })
  }
})
