import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import {
  DEFAULT_ADS,
  DEFAULT_RANKING,
  interleave,
  loadConfig,
  loadInAppAds,
  rankPosts
} from '~/server/utils/feed-ranker'
import type {
  AdServingConfig,
  FeedItem,
  FeedRankingWeights,
  FeedTab
} from '~/server/utils/feed-ranker'
import type { Database } from '~/types/database.types'

export interface FeedResponse {
  success: boolean
  data: {
    items: FeedItem[]
    page: number
    limit: number
    hasMore: boolean
  }
}

export default defineEventHandler(async (event): Promise<FeedResponse> => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const query = getQuery(event)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const page = Math.max(0, Number(query.page) || 0)

  const [weights, ads] = await Promise.all([
    loadConfig<FeedRankingWeights>(supabase, 'feed_ranking', DEFAULT_RANKING),
    loadConfig<AdServingConfig>(supabase, 'ad_serving', DEFAULT_ADS)
  ])

  const tabParam = String(query.tab || 'for-you')
  const tab: FeedTab = tabParam === 'following' || tabParam === 'trending' ? tabParam : 'for-you'

  const posts = await rankPosts(supabase, user.id, limit, page * limit, weights, tab)
  const inAppAds = ads.enabled ? await loadInAppAds(supabase, ads.max_in_app_ads) : []

  return {
    success: true,
    data: {
      items: interleave(posts, inAppAds, ads),
      page,
      limit,
      hasMore: posts.length === limit
    }
  }
})
