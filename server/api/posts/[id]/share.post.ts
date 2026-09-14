import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

const PLATFORMS = ['twitter', 'facebook', 'whatsapp', 'copy', 'email'] as const
type SharePlatform = typeof PLATFORMS[number]

interface SharePostRequest {
  platform: SharePlatform
}

interface SharePostResponse {
  success: boolean
  data: {
    platform: SharePlatform
    shareUrl: string
    sharesCount: number
  }
}

export default defineEventHandler(async (event): Promise<SharePostResponse> => {
  const user = await requireAuth(event)
  const postId = getRouterParam(event, 'id')
  if (!postId) throw createError({ statusCode: 400, statusMessage: 'Post id is required' })

  const body = await readBody<SharePostRequest>(event)
  const platform = body?.platform
  if (!PLATFORMS.includes(platform)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported share target' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data: post, error: postError } = await client
    .from('posts')
    .select('user_id, content, shares_count')
    .eq('id', postId)
    .maybeSingle()

  if (postError) throw createError({ statusCode: 500, statusMessage: postError.message })
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const { error: shareError } = await client
    .from('post_shares')
    .insert({ post_id: postId, user_id: user.id, shared_to: platform })

  if (shareError) throw createError({ statusCode: 500, statusMessage: shareError.message })

  const sharesCount = (post.shares_count ?? 0) + 1
  await client.from('posts').update({ shares_count: sharesCount }).eq('id', postId)

  const { data: author } = await client
    .from('user')
    .select('username')
    .eq('user_id', post.user_id)
    .maybeSingle()

  const siteUrl = useRuntimeConfig().public.siteUrl || 'https://viorp.com'
  const shareUrl = `${siteUrl}/posts/${postId}`
  const shareText = `Check out this post by @${author?.username ?? 'viorp'}: ${post.content.slice(0, 100)}`

  const shareLinks: Record<SharePlatform, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    copy: shareUrl,
    email: `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
  }

  return {
    success: true,
    data: { platform, shareUrl: shareLinks[platform], sharesCount }
  }
})
