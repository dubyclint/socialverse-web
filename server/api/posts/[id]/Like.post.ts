// server/api/posts/[id]/like.post.ts
// ============================================================================
// LIKE POST ENDPOINT
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const postId = getRouterParam(event, 'id')

    const supabase = await serverSupabaseClient(event)

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update post likes count
      await supabase.rpc('update_post_analytics', { post_id_param: postId })

      return {
        success: true,
        data: { liked: false }
      }
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (likeError) throw likeError

      // Update post likes count
      await supabase.rpc('update_post_analytics', { post_id_param: postId })

      // Get post author
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      // Send notification to post author
      if (post && post.user_id !== user.id) {
        const { data: liker } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            type: 'like',
            title: `${liker?.username} liked your post`,
            message: 'Your post received a like',
            related_id: postId,
            related_type: 'post'
          })
      }

      return {
        success: true,
        data: { liked: true }
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to like post'
    })
  }
})
