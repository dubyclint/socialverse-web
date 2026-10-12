import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import type { PostCommentView } from './comments.get'
import { notifyMentions } from '~/server/utils/mention-notify'
import { resolveActor } from '~/server/utils/actor'

interface AddCommentRequest {
  content: string
  parentId?: string
  /** Client-generated id so a retried submission can't post twice. */
  clientId?: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event): Promise<{ success: boolean, data: PostCommentView, commentsCount: number }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const body = await readBody<AddCommentRequest>(event)
  const content = (body.content ?? '').trim()

  if (!content) throw createError({ statusCode: 400, statusMessage: 'Comment content is required' })
  if (content.length > 500) throw createError({ statusCode: 400, statusMessage: 'Comment exceeds 500 character limit' })

  const client = await serverSupabaseClient<Database>(event)
  const actor = await resolveActor(event)
  const pageId = actor.type === 'PAGE' ? actor.id : null

  const clientId = body.clientId && UUID.test(body.clientId) ? body.clientId : undefined
  const columns = 'id, post_id, parent_id, comment_text, created_at, edited_at, user_id' as const

  let { data: comment, error } = await client
    .from('post_comments')
    .insert({
      ...(clientId ? { id: clientId } : {}),
      post_id: postId,
      user_id: user.id,
      page_id: pageId,
      comment_text: content,
      parent_id: body.parentId ?? null
    })
    .select(columns)
    .single()

  let replayed = false
  if (error?.code === '23505' && clientId) {
    ({ data: comment, error } = await client
      .from('post_comments')
      .select(columns)
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single())
    replayed = true
  }

  if (error || !comment) throw createError({ statusCode: 500, statusMessage: error?.message || 'Comment could not be saved' })

  const [{ data: post }, { data: author }, { data: page }] = await Promise.all([
    client.from('posts').select('user_id, page_id, comments_count').eq('id', postId).maybeSingle(),
    client
      .from('user')
      .select('user_id, username, display_name, full_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle(),
    pageId
      ? client.from('pages').select('id, handle, name, avatar_url').eq('id', pageId).maybeSingle()
      : Promise.resolve({ data: null })
  ])

  if (post && !replayed) {
    const actorName = page?.name ?? author?.username ?? 'Someone'
    const notified = new Set<string>()
    if (post.user_id !== user.id && post.page_id !== pageId) {
      notified.add(post.user_id)
      await client.from('notifications').insert({
        recipient_id: post.user_id,
        notifier_id: user.id,
        event_type: 'COMMENT_ADDED',
        message_text: `${actorName} commented: ${content.slice(0, 80)}`,
        source_id: postId
      })
    }
    if (body.parentId) {
      const { data: parent } = await client.from('post_comments').select('user_id').eq('id', body.parentId).maybeSingle()
      if (parent && parent.user_id !== user.id && !notified.has(parent.user_id)) {
        notified.add(parent.user_id)
        await client.from('notifications').insert({
          recipient_id: parent.user_id,
          notifier_id: user.id,
          event_type: 'COMMENT_REPLY',
          message_text: `${actorName} replied to your comment: ${content.slice(0, 80)}`,
          source_id: postId
        })
      }
    }
    await notifyMentions({
      text: content,
      actorId: user.id,
      actorName,
      sourceId: postId,
      eventType: 'MENTION',
      where: 'a comment',
      skip: [...notified]
    })
  }

  return {
    success: true,
    data: {
      id: comment.id,
      postId: comment.post_id,
      parentId: comment.parent_id,
      content: comment.comment_text,
      createdAt: comment.created_at,
      editedAt: comment.edited_at,
      author: page
        ? { id: page.id, username: page.handle, name: page.name, avatar: page.avatar_url, type: 'PAGE' }
        : {
            id: user.id,
            username: author?.username ?? 'unknown',
            name: author?.full_name || author?.display_name || author?.username || 'You',
            avatar: author?.avatar_url ?? null,
            type: 'USER'
          }
    },
    commentsCount: post?.comments_count ?? 0
  }
})
