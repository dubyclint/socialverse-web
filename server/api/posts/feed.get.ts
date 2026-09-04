import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { DEFAULT_RANKING, rankPosts } from '~/server/utils/feed-ranker'
import { loadConfig } from '~/server/utils/platform-config'
import type { FeedRankingWeights, RankedPost } from '~/server/utils/feed-ranker'
import type { Database } from '~/types/database.types'

interface FeedResponse {
  success: boolean
  data: {
    posts: RankedPost[]
    page: number
    limit: number
    hasMore: boolean
  }
}

/**
 * Legacy posts feed: same ranking as /api/feed, without the ad slots so
 * post-only consumers keep a plain array.
 */
export default defineEventHandler(async (event): Promise<FeedResponse> => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(query.limit ?? '12'), 10) || 12))

  const weights = await loadConfig<FeedRankingWeights>(supabase, 'feed_ranking', DEFAULT_RANKING)
  const posts = await rankPosts(supabase, user.id, limit, (page - 1) * limit, weights)

  return {
    success: true,
    data: { posts, page, limit, hasMore: posts.length === limit }
  }
})
