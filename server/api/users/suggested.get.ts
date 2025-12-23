// FILE 1: /server/api/users/suggested.get.ts
// ============================================================================
// GET SUGGESTED USERS - Fetch users to follow
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Suggested Users API] Fetching suggested users')
    
    // Get authenticated user
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

    // Call RPC function to get suggested users
    const { data, error } = await supabase.rpc('get_suggested_users', {
      user_id_param: user.id,
      limit_param: limit
    })

    if (error) {
      console.error('[Suggested Users API] RPC Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch suggested users'
      })
    }

    console.log('[Suggested Users API] ✅ Fetched', data?.length || 0, 'suggested users')

    return {
      success: true,
      data: data || [],
      total: data?.length || 0
    }

  } catch (error: any) {
    console.error('[Suggested Users API] Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch suggested users'
    })
  }
})
