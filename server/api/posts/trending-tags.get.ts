// FILE: /server/api/posts/trending-tags.get.ts
// CORRECTED VERSION (Already mostly correct, just ensure table exists)

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    // ✅ This is already correct - just ensure the table exists
    const { data: tags, error } = await supabase
      .from('trending_hashtags')
      .select('*')
      .order('count', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Trending tags error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch trending tags: ' + error.message
      })
    }

    return {
      success: true,
      tags: tags || [],
      total: tags?.length || 0
    }

  } catch (error: any) {
    console.error('Trending tags API error:', error)
    throw error
  }
})
