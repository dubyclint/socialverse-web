import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export interface FeedRankingWeights {
  like_weight: number
  comment_weight: number
  share_weight: number
  view_weight: number
  following_boost: number
  interest_boost: number
  affinity_boost: number
  gravity: number
  candidate_pool: number
}

export interface AdServingConfig {
  enabled: boolean
  first_slot: number
  every_n_items: number
  max_in_app_ads: number
  external_fallback: boolean
  external_provider: string
  external_client_id: string
  external_slot_id: string
}

export const DEFAULT_RANKING: FeedRankingWeights = {
  like_weight: 3,
  comment_weight: 4,
  share_weight: 5,
  view_weight: 0.2,
  following_boost: 2.5,
  interest_boost: 2,
  affinity_boost: 1.8,
  gravity: 1.5,
  candidate_pool: 300
}

export const DEFAULT_ADS: AdServingConfig = {
  enabled: false,
  first_slot: 0,
  every_n_items: 5,
  max_in_app_ads: 3,
  external_fallback: false,
  external_provider: 'adsense',
  external_client_id: '',
  external_slot_id: ''
}

export interface FeedAuthor {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  verified: boolean
}

export interface RankedPost {
  id: string
  content: string
  created_at: string
  media: string[]
  hashtags: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  liked_by_me: boolean
  author: FeedAuthor | null
  score: number
  reason: 'following' | 'interest' | 'affinity' | 'popular'
}

export interface InAppAd {
  id: string
  title: string
  creativeUrl: string | null
  destinationUrl: string | null
  advertiserId: string
}

export type FeedItem =
  | { type: 'post', post: RankedPost }
  | { type: 'ad', ad: InAppAd }
  | { type: 'external_ad', provider: string, clientId: string, slotId: string }

type Client = SupabaseClient<Database>

export type FeedTab = 'for-you' | 'following' | 'trending'

export const loadConfig = async <T>(
  client: Client,
  key: string,
  fallback: T
): Promise<T> => {
  const { data } = await client
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', key)
    .maybeSingle()

  if (!data?.config_values || typeof data.config_values !== 'object') return fallback
  return { ...fallback, ...(data.config_values as Record<string, unknown>) } as T
}

/**
 * Interest and behaviour ranked posts. Engagement is decayed by age so fresh
 * content can outrank older popular content, then boosted for posts the viewer
 * is connected to: authors they follow, hashtags matching their interests, and
 * authors they have recently interacted with.
 */
export const rankPosts = async (
  client: Client,
  userId: string,
  limit: number,
  offset: number,
  weights: FeedRankingWeights,
  tab: FeedTab = 'for-you'
): Promise<RankedPost[]> => {
  const [{ data: following }, { data: interestLinks }, { data: interactions }] = await Promise.all([
    client.from('follows').select('following_id').eq('follower_id', userId),
    client.from('user_interests').select('interest_id').eq('user_id', userId),
    client
      .from('user_interactions')
      .select('item_id, item_type')
      .eq('user_id', userId)
      .eq('item_type', 'post')
      .order('created_at', { ascending: false })
      .limit(200)
  ])

  const followingIds = new Set((following ?? []).map(row => row.following_id))

  let interestTags = new Set<string>()
  const interestIds = (interestLinks ?? []).map(row => row.interest_id)
  if (interestIds.length) {
    const { data: interests } = await client
      .from('interests')
      .select('name')
      .in('id', interestIds)
    interestTags = new Set((interests ?? []).map(row => row.name.toLowerCase()))
  }

  const interactedPostIds = (interactions ?? []).map(row => row.item_id)
  let affinityAuthorIds = new Set<string>()
  if (interactedPostIds.length) {
    const { data: interactedPosts } = await client
      .from('posts')
      .select('user_id')
      .in('id', interactedPostIds)
    affinityAuthorIds = new Set((interactedPosts ?? []).map(row => row.user_id))
  }

  if (tab === 'following' && followingIds.size === 0) return []

  let candidateQuery = client
    .from('posts')
    .select(
      'id, user_id, content, media_urls, hashtags, likes_count, comments_count, shares_count, created_at'
    )
    .eq('is_draft', false)
    .is('scheduled_at', null)
    .in('privacy', ['public', 'friends'])

  if (tab === 'following') {
    candidateQuery = candidateQuery.in('user_id', Array.from(followingIds))
  }

  const { data: candidates, error } = await candidateQuery
    .order('created_at', { ascending: false })
    .limit(weights.candidate_pool)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const rows = candidates ?? []
  if (!rows.length) return []

  const [{ data: authors }, { data: likes }] = await Promise.all([
    client
      .from('user')
      .select('user_id, username, display_name, full_name, avatar_url, is_verified')
      .in('user_id', Array.from(new Set(rows.map(row => row.user_id)))),
    client
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', rows.map(row => row.id))
  ])

  const authorById = new Map((authors ?? []).map(author => [author.user_id, author]))
  const likedPostIds = new Set((likes ?? []).map(like => like.post_id))
  const now = Date.now()

  const scored: RankedPost[] = rows.map((row) => {
    const hashtags = (row.hashtags ?? []).map(tag => tag.toLowerCase())
    const engagement =
      (row.likes_count ?? 0) * weights.like_weight +
      (row.comments_count ?? 0) * weights.comment_weight +
      (row.shares_count ?? 0) * weights.share_weight

    const ageHours = Math.max(0, (now - new Date(row.created_at).getTime()) / 3_600_000)
    let score = (engagement + 1) / Math.pow(ageHours + 2, weights.gravity)

    if (tab === 'trending') score = engagement

    let reason: RankedPost['reason'] = 'popular'
    if (tab !== 'trending' && hashtags.some(tag => interestTags.has(tag))) {
      score *= weights.interest_boost
      reason = 'interest'
    }
    if (tab !== 'trending' && affinityAuthorIds.has(row.user_id)) {
      score *= weights.affinity_boost
      reason = 'affinity'
    }
    if (tab !== 'trending' && followingIds.has(row.user_id)) {
      score *= weights.following_boost
      reason = 'following'
    }

    const author = authorById.get(row.user_id)

    return {
      id: row.id,
      content: row.content ?? '',
      created_at: row.created_at,
      media: row.media_urls ?? [],
      hashtags: row.hashtags ?? [],
      likes_count: row.likes_count ?? 0,
      comments_count: row.comments_count ?? 0,
      shares_count: row.shares_count ?? 0,
      liked_by_me: likedPostIds.has(row.id),
      author: author
        ? {
            id: author.user_id,
            username: author.username || 'user',
            full_name: author.full_name || author.display_name || author.username || 'User',
            avatar_url: author.avatar_url,
            verified: author.is_verified === true
          }
        : null,
      score,
      reason
    }
  })

  return scored.sort((a, b) => b.score - a.score).slice(offset, offset + limit)
}

/** Active, in-budget, in-window campaigns, highest bid first. */
export const loadInAppAds = async (client: Client, limit: number): Promise<InAppAd[]> => {
  if (limit <= 0) return []

  const nowIso = new Date().toISOString()
  const { data } = await client
    .from('ads_campaigns')
    .select('id, title, ad_creative_url, target_destination_url, advertiser_id, bid_per_unit')
    .eq('status', 'ACTIVE')
    .gt('remaining_budget', 0)
    .lte('starts_at', nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order('bid_per_unit', { ascending: false })
    .limit(limit)

  return (data ?? []).map(row => ({
    id: row.id,
    title: row.title,
    creativeUrl: row.ad_creative_url,
    destinationUrl: row.target_destination_url,
    advertiserId: row.advertiser_id
  }))
}

/**
 * In-app ads take the reserved slots first; ranked posts fill the rest; the
 * external network only fills slots left empty when in-app inventory runs out.
 */
export const interleave = (
  posts: RankedPost[],
  ads: InAppAd[],
  config: AdServingConfig
): FeedItem[] => {
  const items: FeedItem[] = []
  const adQueue = [...ads]
  const every = Math.max(1, config.every_n_items)
  let postIndex = 0
  let slot = 0

  const externalSlot = (): FeedItem | null =>
    config.external_fallback && config.external_client_id
      ? {
          type: 'external_ad',
          provider: config.external_provider,
          clientId: config.external_client_id,
          slotId: config.external_slot_id
        }
      : null

  while (postIndex < posts.length) {
    const isAdSlot =
      config.enabled && (slot === config.first_slot || (slot - config.first_slot) % every === 0)

    if (isAdSlot && slot >= config.first_slot) {
      const ad = adQueue.shift()
      if (ad) {
        items.push({ type: 'ad', ad })
        slot += 1
        continue
      }
      const external = externalSlot()
      if (external) {
        items.push(external)
        slot += 1
        continue
      }
    }

    items.push({ type: 'post', post: posts[postIndex] as RankedPost })
    postIndex += 1
    slot += 1
  }

  return items
}
