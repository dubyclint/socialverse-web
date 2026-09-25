import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Toggles the viewer's like and keeps `posts.likes_count` in step. */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: { liked: boolean, likesCount: number } }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const client = await serverSupabaseClient<Database>(event)

  const [{ data: existing }, { data: post }] = await Promise.all([
    client.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle(),
    client.from('posts').select('user_id, likes_count').eq('id', postId).maybeSingle()
  ])

  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const liked = !existing

  if (existing) {
    const { error } = await client.from('post_likes').delete().eq('id', existing.id)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  } else {
    const { error } = await client.from('post_likes').insert({ post_id: postId, user_id: user.id })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const likesCount = Math.max(0, (post.likes_count ?? 0) + (liked ? 1 : -1))
  await client.from('posts').update({ likes_count: likesCount }).eq('id', postId)

  if (liked && post.user_id !== user.id) {
    const { data: liker } = await client
      .from('user')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle()

    await client.from('notifications').insert({
      recipient_id: post.user_id,
      notifier_id: user.id,
      event_type: 'POST_LIKE',
      message_text: `${liker?.username ?? 'Someone'} liked your post`,
      source_id: postId
    })
  }

  return { success: true, data: { liked, likesCount } }
})
