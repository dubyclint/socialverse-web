// server/utils/ad-engine.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { DiscoveryItem, DiscoveryFeedResponse } from '~/types/discovery'

export interface DiscoveryContent {
  type: DiscoveryFeedResponse['strategy']
  data: DiscoveryItem[]
}

const DISCOVERY_LIMIT = 20

/**
 * Live streams first (they drive gifting velocity), then accounts the viewer
 * does not already follow.
 */
export const getDiscoveryContent = async (
  client: SupabaseClient<Database>,
  userId: string
): Promise<DiscoveryContent> => {
  const { data: liveStreams } = await client
    .from('streams')
    .select('id, title, creator_id, current_viewer_count')
    .eq('broadcast_status', 'LIVE')
    .order('current_viewer_count', { ascending: false })
    .limit(DISCOVERY_LIMIT)

  const creatorIds = (liveStreams || []).map(stream => stream.creator_id)
  const { data: creators } = creatorIds.length
    ? await client
        .from('user')
        .select('user_id, username, display_name, avatar_url, bio')
        .in('user_id', creatorIds)
    : { data: [] }

  const creatorById = new Map((creators || []).map(creator => [creator.user_id, creator]))

  const liveItems: DiscoveryItem[] = (liveStreams || []).flatMap((stream) => {
    const creator = creatorById.get(stream.creator_id)
    if (!creator) return []
    return [{
      id: creator.user_id,
      username: creator.username,
      display_name: creator.display_name || creator.username,
      avatar_url: creator.avatar_url,
      bio: stream.title,
      kind: 'stream' as const,
      stream_id: stream.id,
      viewers: stream.current_viewer_count
    }]
  })

  if (liveItems.length >= DISCOVERY_LIMIT) {
    return { type: 'live', data: liveItems }
  }

  const { data: following } = await client
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const excluded = [userId, ...(following || []).map(f => f.following_id)]

  const { data: candidates } = await client
    .from('user')
    .select('user_id, username, display_name, avatar_url, bio')
    .not('user_id', 'in', `(${excluded.join(',')})`)
    .order('followers_count', { ascending: false })
    .limit(DISCOVERY_LIMIT - liveItems.length)

  const socialItems: DiscoveryItem[] = (candidates || []).map(candidate => ({
    id: candidate.user_id,
    username: candidate.username,
    display_name: candidate.display_name || candidate.username,
    avatar_url: candidate.avatar_url,
    bio: candidate.bio,
    kind: 'user' as const
  }))

  return {
    type: liveItems.length > 0 ? 'live' : 'social',
    data: [...liveItems, ...socialItems]
  }
}
