import type { AdView } from '~/utils/ad-options'
import { getHeader } from 'h3'
import type { H3Event } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { isSensitiveText } from '~/server/utils/ads'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { CANDIDATE_COLUMNS, getAuthors, getCandidatePool, getPageAuthors } from '~/server/utils/feed-cache'
import type { CandidatePost } from '~/server/utils/feed-cache'
import { getLikedPostIds } from '~/server/utils/actor'
import { parseRepostRef } from '~/server/utils/repost'

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
  language_boost?: number
  region_boost?: number
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
  verified_type?: string | null
  type?: 'USER' | 'PAGE'
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
  gifts_count: number
  liked_by_me: boolean
  author: FeedAuthor | null
  repost_of: RepostSource | null
  score: number
  reason: 'following' | 'interest' | 'affinity' | 'popular'
  seen: boolean
}

export interface RepostSource {
  id: string
  content: string
  created_at: string
  media: string[]
  author: FeedAuthor | null
}

export type InAppAd = AdView

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
export interface ViewerLocale {
  language: string | null
  country: string | null
}

/** Primary language from Accept-Language and country from the edge geo header. */
export const viewerLocale = (event: H3Event): ViewerLocale => {
  const lang = (getHeader(event, 'accept-language') ?? '').split(',')[0]?.trim().slice(0, 2).toLowerCase() ?? ''
  const geo = (getHeader(event, 'cf-ipcountry') ?? getHeader(event, 'x-vercel-ip-country') ?? '').toUpperCase()
  return {
    language: /^[a-z]{2}$/.test(lang) ? lang : null,
    country: /^[A-Z]{2}$/.test(geo) && geo !== 'XX' ? geo : null
  }
}

/** Reorders a ranked list so the same author never appears twice in a row when an alternative exists. */
const diversify = <T extends { author: FeedAuthor | null }>(posts: T[]): T[] => {
  const pending = [...posts]
  const out: T[] = []
  while (pending.length) {
    const last = out[out.length - 1]?.author?.id
    const index = pending.findIndex(post => !last || post.author?.id !== last)
    out.push(pending.splice(index === -1 ? 0 : index, 1)[0]!)
  }
  return out
}

export const rankPosts = async (
  client: Client,
  userId: string,
  limit: number,
  offset: number,
  weights: FeedRankingWeights,
  tab: FeedTab = 'for-you',
  likerPageId: string | null = null,
  locale: ViewerLocale = { language: null, country: null }
): Promise<RankedPost[]> => {
  let viewerCountry = locale.country
  if (!viewerCountry) {
    const { data: me } = await getServiceClient().from('user').select('phone_country').eq('user_id', userId).maybeSingle()
    viewerCountry = me?.phone_country && /^[A-Z]{2}$/.test(me.phone_country) ? me.phone_country : null
  }

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
  const { data: followedPages } = await client.from('page_follows').select('page_id').eq('user_id', userId)
  for (const row of followedPages ?? []) followingIds.add(row.page_id)

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
      ? Array.from(byId.values()).filter(row => followingIds.has(row.page_id ?? row.user_id))
      : Array.from(byId.values())

  if (!rows.length) return []

  const pageIds = Array.from(new Set(rows.map(row => row.page_id).filter((id): id is string => Boolean(id))))
  const [authors, pageAuthors, likedPostIds] = await Promise.all([
    getAuthors(Array.from(new Set(rows.filter(row => !row.page_id).map(row => row.user_id)))),
    getPageAuthors(pageIds),
    getLikedPostIds(userId, likerPageId, rows.map(row => row.id))
  ])

  const authorById = new Map(authors.map(author => [author.user_id, author]))
  const pageAuthorById = new Map(pageAuthors.map(page => [page.id, page]))
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
    if (tab !== 'trending' && !row.page_id && affinityAuthorIds.has(row.user_id)) {
      score *= weights.affinity_boost
      reason = 'affinity'
    }
    if (tab !== 'trending' && followingIds.has(row.page_id ?? row.user_id)) {
      score *= weights.following_boost
      reason = 'following'
    }

    if (tab !== 'trending') {
      if (locale.language && row.language === locale.language) score *= weights.language_boost ?? 1.5
      if (viewerCountry && row.country === viewerCountry) score *= weights.region_boost ?? 1.25
    }

    const seen = seenPostIds.has(row.id)
    if (seen && tab !== 'trending') score *= weights.seen_penalty

    const author = row.page_id ? undefined : authorById.get(row.user_id)
    const pageAuthor = row.page_id ? pageAuthorById.get(row.page_id) : undefined

    return {
      id: row.id,
      content: row.content ?? '',
      created_at: row.created_at,
      media: row.media_urls ?? [],
      hashtags: row.hashtags ?? [],
      likes_count: row.likes_count ?? 0,
      comments_count: row.comments_count ?? 0,
      shares_count: row.shares_count ?? 0,
      gifts_count: 0,
      liked_by_me: likedPostIds.has(row.id),
      repost_of: null,
      author: pageAuthor
        ? {
            id: pageAuthor.id,
            username: pageAuthor.handle,
            full_name: pageAuthor.name,
            avatar_url: pageAuthor.avatar_url,
            verified: pageAuthor.is_verified === true,
            verified_type: pageAuthor.verified_type,
            type: 'PAGE' as const
          }
        : author
          ? {
              id: author.user_id,
              username: author.username || 'user',
              full_name: author.full_name || author.display_name || author.username || 'User',
              avatar_url: author.avatar_url,
              verified: author.is_verified === true,
              verified_type: author.verified_type,
              type: 'USER' as const
            }
          : null,
      score,
      reason,
      seen
    }
  })

  const sorted = scored.sort((a, b) => b.score - a.score)
  const page = (tab === 'trending' ? sorted : diversify(sorted)).slice(offset, offset + limit)

  // Reposts carry the original post inline so the card can render it.
  const repostRefs = new Map<string, string>()
  for (const post of page) {
    const ref = parseRepostRef(byId.get(post.id)?.title)
    if (ref) repostRefs.set(post.id, ref)
  }

  if (repostRefs.size) {
    const { data: originals } = await client
      .from('posts')
      .select('id, user_id, content, media_urls, created_at')
      .in('id', Array.from(new Set(repostRefs.values())))

    const originalAuthors = await getAuthors(
      Array.from(new Set((originals ?? []).map(row => row.user_id)))
    )
    const originalAuthorById = new Map(originalAuthors.map(a => [a.user_id, a]))
    const originalById = new Map((originals ?? []).map(row => [row.id, row]))

    for (const post of page) {
      const ref = repostRefs.get(post.id)
      const original = ref ? originalById.get(ref) : undefined
      if (!original) continue
      const originalAuthor = originalAuthorById.get(original.user_id)
      post.repost_of = {
        id: original.id,
        content: original.content ?? '',
        created_at: original.created_at,
        media: original.media_urls ?? [],
        author: originalAuthor
          ? {
              id: originalAuthor.user_id,
              username: originalAuthor.username || 'user',
              full_name:
                originalAuthor.full_name ||
                originalAuthor.display_name ||
                originalAuthor.username ||
                'User',
              avatar_url: originalAuthor.avatar_url,
              verified: originalAuthor.is_verified === true,
              verified_type: originalAuthor.verified_type
            }
          : null
      }
    }
  }

  // Gift counts are only needed for the page actually rendered.
  if (page.length) {
    const { data: gifts } = await client
      .from('post_gifts')
      .select('post_id')
      .in('post_id', page.map(post => post.id))

    const giftsByPost = new Map<string, number>()
    for (const row of gifts ?? []) {
      if (!row.post_id) continue
      giftsByPost.set(row.post_id, (giftsByPost.get(row.post_id) ?? 0) + 1)
    }
    for (const post of page) {
      post.gifts_count = giftsByPost.get(post.id) ?? 0
    }
  }

  return page
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

  let owed = false

  while (postIndex < posts.length) {
    const isAdSlot =
      config.enabled && slot >= config.first_slot && (slot - config.first_slot) % every === 0
    const previous = items[items.length - 1]
    const unsafe = previous?.type === 'post' && isSensitiveText(previous.post.content)

    if ((isAdSlot || owed) && unsafe) {
      owed = true
    } else if (isAdSlot || owed) {
      owed = false
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
