// server/api/posts/[id]/comments.post.ts
// ============================================================================
// ADD COMMENT ENDPOINT
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface AddCommentRequest {
  content: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const postId = getRouterParam(event, 'id')
    const body = await readBody<AddCommentRequest>(event)

    if (!body.content || body.content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment content is required'
      })
    }

    if (body.content.length > 500) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment exceeds 500 character limit'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: body.content
      })
      .select()
      .single()

    if (commentError) throw commentError

    // Update post comments count
    await supabase.rpc('update_post_analytics', { post_id_param: postId })

    // Get post author
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    // Send notification to post author
    if (post && post.user_id !== user.id) {
      const { data: commenter } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      await supabase
        .from('notifications')
        .insert({
          user_id: post.user_id,
          type: 'comment',
          title: `${commenter?.username} commented on your post`,
          message: body.content.substring(0, 50) + '...',
          related_id: postId,
          related_type: 'post'
        })
    }

    // Get full comment with user info
    const { data: fullComment } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .eq('id', comment.id)
      .single()

    return {
      success: true,
      data: fullComment
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to add comment'
    })
  }
})
    
