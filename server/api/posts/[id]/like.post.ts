import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import { resolveActor } from '~/server/utils/actor'

/** Sets (or toggles) the viewer's like; the database keeps `posts.likes_count` in step. */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: { liked: boolean, likesCount: number } }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const body = await readBody<{ liked?: boolean } | null>(event).catch(() => null)
  const client = await serverSupabaseClient<Database>(event)
  const actor = await resolveActor(event)
  const pageId = actor.type === 'PAGE' ? actor.id : null

  const { data: post } = await client.from('posts').select('user_id, page_id').eq('id', postId).maybeSingle()
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  // An explicit desired state makes retries idempotent; without one, toggle.
  let desired = body?.liked
  if (typeof desired !== 'boolean') {
    const query = client.from('post_likes').select('id').eq('post_id', postId)
    const { data: existing } = pageId
      ? await query.eq('page_id', pageId).maybeSingle()
      : await query.eq('user_id', user.id).is('page_id', null).maybeSingle()
    desired = !existing
  }

  const { data: rows, error } = await client.rpc('set_post_like', { p_post_id: postId, p_liked: desired, p_page_id: pageId })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const result = rows?.[0]
  const liked = desired
  const likesCount = result?.likes_count ?? 0

  if (liked && result?.changed && post.user_id !== user.id && post.page_id !== pageId) {
    const { data: liker } = pageId
      ? await client.from('pages').select('username:name').eq('id', pageId).maybeSingle()
      : await client.from('user').select('username').eq('user_id', user.id).maybeSingle()

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
