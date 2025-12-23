// ============================================================================
// FILE 2: /server/api/trending.get.ts
// ============================================================================
// GET TRENDING TOPICS - Fetch trending hashtags and topics
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Trending API] Fetching trending topics')
    
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 5, 20)

    const supabase = await serverSupabaseClient(event)

    // Call RPC function to get trending topics
    const { data, error } = await supabase.rpc('get_trending_topics', {
      limit_param: limit
    })

    if (error) {
      console.error('[Trending API] RPC Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch trending topics'
      })
    }

    console.log('[Trending API] ✅ Fetched', data?.length || 0, 'trending topics')

    return {
      success: true,
      data: data || [],
      total: data?.length || 0
    }

  } catch (error: any) {
    console.error('[Trending API] Error:', error.message)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch trending topics'
    })
  }
})
