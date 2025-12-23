// ============================================================================
// COMPLETE FIX: /server/api/posts/feed.get.ts
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Feed API] Starting feed fetch')
    
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)
    const offset = (page - 1) * limit

    const supabase = await serverSupabaseClient(event)

    console.log('[Feed API] Fetching posts for user:', user.id)

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        video_url,
        created_at,
        updated_at,
        user_id,
        users:user_id (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Feed API] Query error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts'
      })
    }

    console.log('[Feed API] ✅ Fetched', posts?.length || 0, 'posts')

    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      content: post.content,
      image: post.image_url,
      video: post.video_url,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      likes: 0,
      comments: 0,
      shares: 0,
      author: {
        id: post.users?.id,
        name: post.users?.name || 'Unknown',
        username: post.users?.username || 'unknown',
        avatar: post.users?.avatar_url || '/default-avatar.svg'
      }
    }))

    return {
      success: true,
      data: formattedPosts,
      hasMore: (posts?.length || 0) === limit
    }

  } catch (error: any) {
    console.error('[Feed API] Error:', error.message)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch feed'
    })
  }
})
