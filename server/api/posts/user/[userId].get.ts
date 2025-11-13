// server/api/posts/user/[userId].get.ts - Get Posts by User ID
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = getRouterParam(event, 'userId')
    const query = getQuery(event)
    
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 12
    const offset = (page - 1) * limit

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Fetch posts by user (non-deleted only)
    const { data: posts, error: postsError, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts'
      })
    }

    const total = count || 0
    const has_more = (page * limit) < total

    return {
      success: true,
      posts: posts || [],
      total,
      page,
      limit,
      has_more
    }
  } catch (error: any) {
    console.error('Error fetching user posts:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch posts'
    })
  }
})
