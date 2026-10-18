import { getOptionalUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'
import { actingPageId, getLikedPostIds } from '~/server/utils/actor'

export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const query = getQuery(event)
  const pageNum = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(30, Math.max(1, Number(query.limit) || 10))
  const offset = (pageNum - 1) * limit
  const viewer = await getOptionalUser(event)
  const service = getServiceClient()

  const { data: rows, error, count } = await service
    .from('posts')
    .select('id, content, created_at, media_urls, hashtags, likes_count, comments_count, shares_count', { count: 'exact' })
    .eq('page_id', page.id)
    .eq('privacy', 'public')
    .eq('is_draft', false)
    .is('scheduled_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const ids = (rows ?? []).map(r => r.id)
  const liked = await getLikedPostIds(viewer?.id ?? null, actingPageId(event), ids)

  const author = {
    id: page.id,
    username: page.handle,
    full_name: page.name,
    avatar_url: page.avatar_url,
    verified: page.is_verified === true,
    verified_type: page.verified_type,
    type: 'PAGE' as const
  }
  const posts = (rows ?? []).map(row => ({
    id: row.id,
    content: row.content ?? '',
    created_at: row.created_at,
    media: row.media_urls ?? [],
    hashtags: row.hashtags ?? [],
    likes_count: row.likes_count ?? 0,
    comments_count: row.comments_count ?? 0,
    shares_count: row.shares_count ?? 0,
    gifts_count: 0,
    liked_by_me: liked.has(row.id),
    author,
    repost_of: null
  }))
  return { posts, total: count ?? 0, hasMore: offset + limit < (count ?? 0) }
})
