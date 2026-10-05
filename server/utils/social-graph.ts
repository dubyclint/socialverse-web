import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { loadBlockedIds } from '~/server/utils/pals'

export type PalStatus = 'none' | 'friends' | 'outgoing' | 'incoming'

export interface Relationship {
  is_self: boolean
  is_following: boolean
  follows_you: boolean
  pal_status: PalStatus
  pal_request_id: string | null
  blocked: boolean
}

export interface DirectoryProfile {
  id: string
  username: string | null
  name: string
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
}

export const DIRECTORY_COLUMNS = 'user_id, username, display_name, full_name, avatar_url, is_verified'

export const toDirectoryProfile = (row: {
  user_id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean | null
}): DirectoryProfile => ({
  id: row.user_id,
  username: row.username,
  name: row.display_name || row.full_name || row.username || 'Unknown',
  full_name: row.full_name || row.display_name,
  avatar_url: row.avatar_url,
  is_verified: row.is_verified ?? false
})

/** The viewer's follow, PAL and block relationship with each of `ids`. */
export const loadRelationships = async (
  client: SupabaseClient<Database>,
  viewerId: string,
  ids: string[]
): Promise<Map<string, Relationship>> => {
  const result = new Map<string, Relationship>()
  if (!ids.length) return result

  const [{ data: outgoing }, { data: incoming }, { data: pals }, blockedIds] = await Promise.all([
    client.from('follows').select('following_id').eq('follower_id', viewerId).in('following_id', ids),
    client.from('follows').select('follower_id').eq('following_id', viewerId).in('follower_id', ids),
    client
      .from('pals')
      .select('id, user_id, pal_id, status')
      .in('status', ['pending', 'accepted'])
      .or(`and(user_id.eq.${viewerId},pal_id.in.(${ids.join(',')})),and(pal_id.eq.${viewerId},user_id.in.(${ids.join(',')}))`),
    loadBlockedIds(client, viewerId)
  ])

  const following = new Set((outgoing ?? []).map(row => row.following_id))
  const followers = new Set((incoming ?? []).map(row => row.follower_id))
  const palRows = new Map<string, { id: string, user_id: string, status: string }>()
  for (const row of pals ?? []) {
    palRows.set(row.user_id === viewerId ? row.pal_id : row.user_id, row)
  }

  for (const id of ids) {
    const pal = palRows.get(id)
    let palStatus: PalStatus = 'none'
    if (pal?.status === 'accepted') palStatus = 'friends'
    else if (pal?.status === 'pending') palStatus = pal.user_id === viewerId ? 'outgoing' : 'incoming'

    result.set(id, {
      is_self: id === viewerId,
      is_following: following.has(id),
      follows_you: followers.has(id),
      pal_status: palStatus,
      pal_request_id: pal?.status === 'pending' ? pal.id : null,
      blocked: blockedIds.has(id)
    })
  }
  return result
}

export const countFollowGraph = async (client: SupabaseClient<Database>, userId: string) => {
  const [followers, following, pals] = await Promise.all([
    client.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    client.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    client
      .from('pals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},pal_id.eq.${userId}`)
  ])
  return {
    followers_count: followers.count ?? 0,
    following_count: following.count ?? 0,
    pals_count: pals.count ?? 0
  }
}
