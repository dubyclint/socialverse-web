import { getServiceClient } from '~/server/utils/supabase-admin'
import type { FeedTab } from '~/server/utils/feed-ranker'

export interface CandidatePost {
  id: string
  user_id: string
  content: string
  media_urls: string[] | null
  hashtags: string[] | null
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
}

export interface CandidateAuthor {
  user_id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean | null
}

const CANDIDATE_TTL_SECONDS = 60
const AUTHOR_TTL_SECONDS = 300

export const CANDIDATE_COLUMNS =
  'id, user_id, content, media_urls, hashtags, likes_count, comments_count, shares_count, created_at'

/**
 * Public posts only — the pool is shared between viewers, so anything with
 * restricted visibility must be read through the viewer's own RLS client
 * instead of this cache. Only the scoring is personal, so one cached read
 * serves every viewer for the TTL rather than re-reading a few hundred rows on
 * each scroll page.
 *
 * Nitro's cache driver is configurable, so pointing this at Redis later is a
 * `nitro.storage` change and needs no code edits here.
 */
export const getCandidatePool = defineCachedFunction(
  async (poolSize: number, _tab: FeedTab): Promise<CandidatePost[]> => {
    const client = getServiceClient()
    const { data, error } = await client
      .from('posts')
      .select(CANDIDATE_COLUMNS)
      .eq('is_draft', false)
      .is('scheduled_at', null)
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .limit(poolSize)

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data ?? []
  },
  {
    name: 'feed-candidates',
    maxAge: CANDIDATE_TTL_SECONDS,
    getKey: (poolSize: number, tab: FeedTab) => `${tab}:${poolSize}`
  }
)

/** Author profiles change rarely; cached per author id set. */
export const getAuthors = defineCachedFunction(
  async (authorIds: string[]): Promise<CandidateAuthor[]> => {
    if (!authorIds.length) return []
    const client = getServiceClient()
    const { data, error } = await client
      .from('user')
      .select('user_id, username, display_name, full_name, avatar_url, is_verified')
      .in('user_id', authorIds)

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data ?? []
  },
  {
    name: 'feed-authors',
    maxAge: AUTHOR_TTL_SECONDS,
    getKey: (authorIds: string[]) => [...authorIds].sort().join(',').slice(0, 512)
  }
)
