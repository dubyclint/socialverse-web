import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Deletes the viewer's own comment together with its replies. */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: { commentsCount: number } }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  const commentId = getRouterParam(event, 'commentId')
  if (!postId || !commentId) throw createError({ statusCode: 400, statusMessage: 'Comment id is required' })

  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .select('id')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Comment not found' })

  const { data: post } = await client.from('posts').select('comments_count').eq('id', postId).maybeSingle()
  return { success: true, data: { commentsCount: post?.comments_count ?? 0 } }
})
