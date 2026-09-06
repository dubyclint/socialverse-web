import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { CANDIDATE_COLUMNS, getAuthors, getCandidatePool } from '~/server/utils/feed-cache'
import type { CandidatePost } from '~/server/utils/feed-cache'

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
  seen_penalty: number
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
  candidate_pool: 300,
  seen_penalty: 0.35
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
  seen: boolean
}

export interface InAppAd {
  id: string
  title: string
  creativeUrl: string | null
  destinationUrl: string | null
  advertiserId: string
}

export interface ExternalAdSlot {
  id: string
  provider: string
  clientId: string
  slotId: string
}

export type FeedItem =
  | { type: 'post', post: RankedPost }
  | { type: 'ad', ad: InAppAd }
  | { type: 'external_ad', slotRef: string, provider: string, clientId: string, slotId: string }

type Client = SupabaseClient<Database>

export type FeedTab = 'for-you' | 'following' | 'trending'

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
      .select('item_id, interaction_type')
      .eq('user_id', userId)
      .eq('item_type', 'post')
      .order('created_at', { ascending: false })
      .limit(500)
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

  // A passive impression means "already seen"; an explicit action means the
  // viewer engages with that author, which is the affinity signal.
  const seenPostIds = new Set(
    (interactions ?? [])
      .filter(row => row.interaction_type === 'view' || row.interaction_type === 'hide')
      .map(row => row.item_id)
  )
  const engagedPostIds = (interactions ?? [])
    .filter(row => row.interaction_type !== 'view' && row.interaction_type !== 'hide')
    .map(row => row.item_id)

  let affinityAuthorIds = new Set<string>()
  if (engagedPostIds.length) {
    const { data: interactedPosts } = await client
      .from('posts')
      .select('user_id')
      .in('id', engagedPostIds)
    affinityAuthorIds = new Set((interactedPosts ?? []).map(row => row.user_id))
  }

  if (tab === 'following' && followingIds.size === 0) return []

  // Public posts come from the shared cached pool; anything with restricted
  // visibility is read through the viewer's own client so RLS decides what they
  // are allowed to see. Only the scoring is personal.
  // The viewer's own posts are read uncached so a post they just published is
  // in their feed immediately rather than after the pool TTL.
  const [publicPool, { data: restricted }, { data: own }] = await Promise.all([
    getCandidatePool(weights.candidate_pool, tab),
    client
      .from('posts')
      .select(CANDIDATE_COLUMNS)
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .neq('privacy', 'public')
      .order('created_at', { ascending: false })
      .limit(weights.candidate_pool),
    client
      .from('posts')
      .select(CANDIDATE_COLUMNS)
      .eq('user_id', userId)
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .order('created_at', { ascending: false })
      .limit(25)
  ])

  const byId = new Map<string, CandidatePost>()
  for (const row of [
    ...publicPool,
    ...((restricted ?? []) as CandidatePost[]),
    ...((own ?? []) as CandidatePost[])
  ]) {
    byId.set(row.id, row)
  }

  const rows: CandidatePost[] =
    tab === 'following'
      ? Array.from(byId.values()).filter(row => followingIds.has(row.user_id))
      : Array.from(byId.values())

  if (!rows.length) return []

  const [authors, { data: likes }] = await Promise.all([
    getAuthors(Array.from(new Set(rows.map(row => row.user_id)))),
    client
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', rows.map(row => row.id))
  ])

  const authorById = new Map(authors.map(author => [author.user_id, author]))
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

    // Interests match a hashtag, or the interest name appearing in the body,
    // so posts that were never hashtagged can still be ranked on interest.
    const body = (row.content ?? '').toLowerCase()
    const matchesInterest =
      hashtags.some(tag => interestTags.has(tag)) ||
      Array.from(interestTags).some(tag => tag.length > 3 && body.includes(tag))

    let reason: RankedPost['reason'] = 'popular'
    if (tab !== 'trending' && matchesInterest) {
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

    const seen = seenPostIds.has(row.id)
    if (seen && tab !== 'trending') score *= weights.seen_penalty

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
      reason,
      seen
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
 * Registered external network placements, ordered by how well they match the
 * viewer's interests and then by bid. Placements with no interest targeting
 * match everyone, so they act as the house fallback.
 */
export const loadExternalSlots = async (
  client: Client,
  userId: string
): Promise<ExternalAdSlot[]> => {
  const [{ data: slots }, { data: interestLinks }] = await Promise.all([
    client
      .from('external_ad_slots')
      .select('id, provider, client_id, slot_id, interest_ids, bid_per_mille')
      .eq('is_active', true),
    client.from('user_interests').select('interest_id').eq('user_id', userId)
  ])

  if (!slots?.length) return []

  const viewerInterests = new Set((interestLinks ?? []).map(row => row.interest_id))

  return slots
    .map(row => {
      const targeting = row.interest_ids ?? []
      const matches = targeting.filter(id => viewerInterests.has(id)).length
      return {
        slot: {
          id: row.id,
          provider: row.provider,
          clientId: row.client_id,
          slotId: row.slot_id
        },
        matches,
        untargeted: targeting.length === 0,
        bid: Number(row.bid_per_mille ?? 0)
      }
    })
    .filter(entry => entry.matches > 0 || entry.untargeted)
    .sort((a, b) => b.matches - a.matches || b.bid - a.bid)
    .map(entry => entry.slot)
}

/**
 * In-app ads take the reserved slots first; ranked posts fill the rest; the
 * external network only fills slots left empty when in-app inventory runs out.
 */
export const interleave = (
  posts: RankedPost[],
  ads: InAppAd[],
  config: AdServingConfig,
  externalSlots: ExternalAdSlot[] = []
): FeedItem[] => {
  const items: FeedItem[] = []
  const adQueue = [...ads]
  const every = Math.max(1, config.every_n_items)
  let postIndex = 0
  let slot = 0
  let externalIndex = 0

  const configuredSlot: ExternalAdSlot | null = config.external_client_id
    ? {
        id: 'config',
        provider: config.external_provider,
        clientId: config.external_client_id,
        slotId: config.external_slot_id
      }
    : null

  const rotation = externalSlots.length ? externalSlots : configuredSlot ? [configuredSlot] : []

  const externalSlot = (): FeedItem | null => {
    if (!config.external_fallback || rotation.length === 0) return null
    const next = rotation[externalIndex % rotation.length] as ExternalAdSlot
    externalIndex += 1
    return {
      type: 'external_ad',
      slotRef: next.id,
      provider: next.provider,
      clientId: next.clientId,
      slotId: next.slotId
    }
  }

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
