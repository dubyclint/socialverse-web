// server/api/trending.ts
import { serverSupabaseClient } from '#supabase/server'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 5

    console.log('[API] Fetching trending topics - limit:', limit)

    const supabase = await serverSupabaseClient(event)

    // Fetch trending hashtags
    const { data: trending, error } = await supabase
      .from('hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API] Error fetching trending:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch trending topics'
      })
    }

    console.log('[API] ✅ Trending topics fetched:', trending?.length)

    return {
      success: true,
      data: trending || []
    }

  } catch (error: any) {
    console.error('[API] Trending error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch trending topics'
    })
  }
})
