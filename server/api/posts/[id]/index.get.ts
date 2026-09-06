import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export interface PostDetailView {
  id: string
  title: string | null
  content: string
  media: string[]
  tags: string[]
  privacy: string
  createdAt: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  likedByMe: boolean
  isMine: boolean
  author: {
    id: string
    username: string
    name: string
    avatar: string | null
    isVerified: boolean
  }
}

export default defineEventHandler(async (event): Promise<{ success: boolean, data: PostDetailView }> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: post, error } = await client
    .from('posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const [{ data: author }, { data: like }] = await Promise.all([
    client
      .from('user')
      .select('user_id, username, display_name, full_name, avatar_url, is_verified')
      .eq('user_id', post.user_id)
      .maybeSingle(),
    client
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()
  ])

  return {
    success: true,
    data: {
      id: post.id,
      title: post.title,
      content: post.content,
      media: post.media_urls ?? [],
      tags: post.hashtags ?? [],
      privacy: post.privacy,
      createdAt: post.created_at,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      sharesCount: post.shares_count,
      likedByMe: Boolean(like),
      isMine: post.user_id === user.id,
      author: {
        id: post.user_id,
        username: author?.username ?? 'unknown',
        name: author?.full_name || author?.display_name || author?.username || 'Unknown user',
        avatar: author?.avatar_url ?? null,
        isVerified: author?.is_verified === true
      }
    }
  }
})
