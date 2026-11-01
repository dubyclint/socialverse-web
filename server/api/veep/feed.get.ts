import { getQuery } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { loadConfig } from '~/server/utils/platform-config'
import { loadTargetedAds } from '~/server/utils/ads'
import { actingPageId } from '~/server/utils/actor'
import { DEFAULT_ADS, DEFAULT_RANKING, interleave, rankPosts, viewerLocale } from '~/server/utils/feed-ranker'
import type { AdServingConfig, FeedRankingWeights, FeedTab } from '~/server/utils/feed-ranker'
import type { Database } from '~/types/database.types'

const TABS: Record<string, FeedTab> = { veep: 'for-you', global: 'global', trend: 'trending', hood: 'hood' }

/** Full-screen Veep feed: media posts only, same ranking + ad rules as the main feed (no strips). */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)
  const q = getQuery(event)
  const tab = TABS[String(q.tab ?? 'veep')] ?? 'for-you'
  const page = Math.max(0, Number(q.page) || 0)
  const limit = 12
  const [weights, ads] = await Promise.all([
    loadConfig<FeedRankingWeights>(supabase, 'feed_ranking', DEFAULT_RANKING),
    loadConfig<AdServingConfig>(supabase, 'ad_serving', DEFAULT_ADS)
  ])
  // Over-fetch, then keep posts that have media.
  const ranked = await rankPosts(supabase, user.id, limit * 3, page * limit * 3, weights, tab, actingPageId(event), viewerLocale(event))
  const posts = ranked.filter(p => p.media.length > 0).slice(0, limit)
  if (posts.length) {
    const { data: flags } = await supabase.from('posts').select('id, allow_download' as never).in('id', posts.map(p => p.id))
    const allow = new Map(((flags ?? []) as unknown as { id: string, allow_download: boolean | null }[]).map(f => [f.id, f.allow_download !== false]))
    for (const p of posts) Object.assign(p, { allow_download: allow.get(p.id) ?? true, is_mine: p.author?.id === user.id })
  }
  const startId = typeof q.start === 'string' ? q.start : null
  if (startId && page === 0 && !posts.some(p => p.id === startId)) {
    const { data: one } = await supabase.from('posts').select('id').eq('id', startId).maybeSingle()
    if (one) {
      const extra = await rankPosts(supabase, user.id, 60, 0, weights, 'for-you', actingPageId(event), viewerLocale(event))
      const hit = extra.find(p => p.id === startId)
      if (hit) posts.unshift(hit)
    }
  } else if (startId && page === 0) {
    const i = posts.findIndex(p => p.id === startId)
    if (i > 0) posts.unshift(...posts.splice(i, 1))
  }
  const inAppAds = ads.enabled ? await loadTargetedAds(event, user.id, ads.max_in_app_ads) : []
  return { items: interleave(posts, inAppAds, ads, []), hasMore: ranked.length === limit * 3 }
})
