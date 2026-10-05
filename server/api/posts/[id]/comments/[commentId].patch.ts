import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Edits the viewer's own comment. */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: { id: string, content: string, editedAt: string | null } }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  const commentId = getRouterParam(event, 'commentId')
  if (!postId || !commentId) throw createError({ statusCode: 400, statusMessage: 'Comment id is required' })

  const body = await readBody<{ content?: string }>(event)
  const content = (body?.content ?? '').trim()
  if (!content) throw createError({ statusCode: 400, statusMessage: 'Comment content is required' })
  if (content.length > 500) throw createError({ statusCode: 400, statusMessage: 'Comment exceeds 500 character limit' })

  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client
    .from('post_comments')
    .update({ comment_text: content, edited_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .select('id, comment_text, edited_at')
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Comment not found' })

  return { success: true, data: { id: data.id, content: data.comment_text, editedAt: data.edited_at } }
})
