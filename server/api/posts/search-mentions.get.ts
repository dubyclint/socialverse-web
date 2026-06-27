// server/api/posts/search-mentions.get.ts
// ============================================================================
// SEARCH USERS FOR MENTIONS - For mention autocomplete
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const searchQuery = query.q as string

    if (!searchQuery || searchQuery.length < 2) {
      return {
        success: true,
        data: []
      }
    }

    const supabase = await serverSupabaseClient(event)

    // Search for users
    const { data: users, error } = await supabase
      .rpc('search_users_for_mention', {
        search_query: searchQuery
      })

    if (error) {
      console.error('[Search Mentions API] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to search users'
      })
    }

    return {
      success: true,
      data: users || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to search users'
    })
  }
})
