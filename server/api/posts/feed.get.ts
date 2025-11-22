// server/api/posts/feed.get.ts
// ============================================================================
// GET POST FEED - Fetch posts for user feed
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = parseInt(query.offset as string) || 0

    const supabase = await serverSupabaseClient(event)

    // Get user feed using the function
    const { data: posts, error } = await supabase
      .rpc('get_user_feed', {
        user_id_param: user.id,
        limit_param: limit,
        offset_param: offset
      })

    if (error) {
      console.error('[Feed API] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch feed'
      })
    }

    // Get full post data with media and tags
    const postsWithDetails = await Promise.all(
      (posts || []).map(async (post: any) => {
        const { data: media } = await supabase
          .from('post_media')
          .select('*')
          .eq('post_id', post.id)

        const { data: tags } = await supabase
          .from('post_tags')
          .select('tag')
          .eq('post_id', post.id)

        return {
          ...post,
          media: media || [],
          tags: tags?.map(t => t.tag) || []
        }
      })
    )

    return {
      success: true,
      data: postsWithDetails
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch feed'
    })
  }
})
