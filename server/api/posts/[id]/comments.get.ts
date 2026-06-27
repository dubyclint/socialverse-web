// server/api/posts/[id]/comments.get.ts
// ============================================================================
// GET POST COMMENTS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const postId = getRouterParam(event, 'id')
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = parseInt(query.offset as string) || 0

    const supabase = await serverSupabaseClient(event)

    // Get comments with user info
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles (id, username, avatar_url),
        comment_likes (id)
      `)
      .eq('post_id', postId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Format comments
    const formattedComments = comments?.map(comment => ({
      ...comment,
      likes_count: comment.comment_likes?.length || 0,
      user: comment.profiles
    })) || []

    return {
      success: true,
      data: formattedComments
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch comments'
    })
  }
})
