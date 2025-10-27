// server/api/posts/trending-tags.get.ts
// ============================================================================
// GET TRENDING HASHTAGS - For autocomplete suggestions
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    // Get trending hashtags from the last 7 days
    const { data: trendingTags, error } = await supabase
      .from('trending_hashtags')
      .select('tag, usage_count, last_used_at')
      .limit(50)

    if (error) {
      console.error('[Trending Tags API] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch trending tags'
      })
    }

    return {
      success: true,
      data: trendingTags || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch trending tags'
    })
  }
})
