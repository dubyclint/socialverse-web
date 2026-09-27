import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'
import type { PostCommentView } from './comments.get'

interface AddCommentRequest {
  content: string
  parentId?: string
}

export default defineEventHandler(async (event): Promise<{ success: boolean, data: PostCommentView }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const body = await readBody<AddCommentRequest>(event)
  const content = (body.content ?? '').trim()

  if (!content) throw createError({ statusCode: 400, statusMessage: 'Comment content is required' })
  if (content.length > 500) throw createError({ statusCode: 400, statusMessage: 'Comment exceeds 500 character limit' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: comment, error } = await client
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      comment_text: content,
      parent_id: body.parentId ?? null
    })
    .select('id, post_id, parent_id, comment_text, created_at, user_id')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const [{ data: post }, { data: author }] = await Promise.all([
    client.from('posts').select('user_id, comments_count').eq('id', postId).maybeSingle(),
    client
      .from('user')
      .select('user_id, username, display_name, full_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
  ])

  if (post) {
    await client
      .from('posts')
      .update({ comments_count: (post.comments_count ?? 0) + 1 })
      .eq('id', postId)

    if (post.user_id !== user.id) {
      await client.from('notifications').insert({
        recipient_id: post.user_id,
        notifier_id: user.id,
        event_type: body.parentId ? 'COMMENT_REPLY' : 'COMMENT_ADDED',
        message_text: `${author?.username ?? 'Someone'} commented: ${content.slice(0, 80)}`,
        source_id: postId
      })
    }
  }

  return {
    success: true,
    data: {
      id: comment.id,
      postId: comment.post_id,
      parentId: comment.parent_id,
      content: comment.comment_text,
      createdAt: comment.created_at,
      author: {
        id: user.id,
        username: author?.username ?? 'unknown',
        name: author?.full_name || author?.display_name || author?.username || 'You',
        avatar: author?.avatar_url ?? null
      }
    }
  }
})
