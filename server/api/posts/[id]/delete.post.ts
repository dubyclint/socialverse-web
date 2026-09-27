import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

interface DeletePostResponse {
  success: boolean
  message: string
}

export default defineEventHandler(async (event): Promise<DeletePostResponse> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post ID is required' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: post, error: postError } = await client
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle()

  if (postError) throw createError({ statusCode: 500, statusMessage: postError.message })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  if (post.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'You can only delete your own posts' })
  }

  await Promise.all([
    client.from('post_likes').delete().eq('post_id', postId),
    client.from('post_comments').delete().eq('post_id', postId),
    client.from('post_shares').delete().eq('post_id', postId),
    client.from('post_views').delete().eq('post_id', postId)
  ])

  const { error: deleteError } = await client.from('posts').delete().eq('id', postId)
  if (deleteError) throw createError({ statusCode: 500, statusMessage: deleteError.message })

  return { success: true, message: 'Post deleted' }
})
