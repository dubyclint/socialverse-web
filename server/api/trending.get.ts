// FILE: /server/api/trending.get.ts
// CORRECTED VERSION

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    // ✅ FIXED: Changed from 'tags' to 'trending_hashtags'
    const { data: trendingTags, error: tagsError } = await supabase
      .from('trending_hashtags')
      .select('*')
      .order('count', { ascending: false })
      .limit(10)

    if (tagsError) {
      console.error('Trending tags error:', tagsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch trending tags'
      })
    }

    // Fetch trending posts
    const { data: trendingPosts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (postsError) {
      console.error('Trending posts error:', postsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch trending posts'
      })
    }

    return {
      tags: trendingTags || [],
      posts: trendingPosts || []
    }

  } catch (error: any) {
    console.error('Trending API error:', error)
    throw error
  }
})

