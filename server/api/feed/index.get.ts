import { loadConfig } from '~/server/utils/platform-config'
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { actingPageId } from '~/server/utils/actor'
import { loadTargetedAds } from '~/server/utils/ads'
import {
  DEFAULT_ADS,
  DEFAULT_RANKING,
  interleave,
  loadExternalSlots,
  rankPosts,
  viewerLocale
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

const CONFIG_TTL_MS = 30_000
const configCache = new Map<string, { at: number, value: unknown }>()
const cachedConfig = async <T>(client: Parameters<typeof loadConfig>[0], key: string, fallback: T): Promise<T> => {
  const hit = configCache.get(key)
  if (hit && Date.now() - hit.at < CONFIG_TTL_MS) return hit.value as T
  const value = await loadConfig<T>(client, key, fallback)
  configCache.set(key, { at: Date.now(), value })
  return value
}

export default defineEventHandler(async (event): Promise<FeedResponse> => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const query = getQuery(event)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const page = Math.max(0, Number(query.page) || 0)

  const [weights, ads] = await Promise.all([
    cachedConfig<FeedRankingWeights>(supabase, 'feed_ranking', DEFAULT_RANKING),
    cachedConfig<AdServingConfig>(supabase, 'ad_serving', DEFAULT_ADS)
  ])

  const tabParam = String(query.tab || 'for-you')
  const tab: FeedTab = tabParam === 'following' || tabParam === 'trending' ? tabParam : 'for-you'

  // Ads do not depend on the ranked posts, so they load alongside ranking.
  const [posts, inAppAds, externalSlots] = await Promise.all([
    rankPosts(supabase, user.id, limit, page * limit, weights, tab, actingPageId(event), viewerLocale(event)),
    ads.enabled ? loadTargetedAds(event, user.id, ads.max_in_app_ads) : Promise.resolve([]),
    ads.enabled && ads.external_fallback
      ? loadExternalSlots(supabase, user.id)
      : Promise.resolve([])
  ])

  return {
    success: true,
    data: {
      items: interleave(posts, inAppAds, ads, externalSlots),
      page,
      limit,
      hasMore: posts.length === limit
    }
  }
})
