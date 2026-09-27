import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export interface PalProfile {
  id: string
  username: string | null
  name: string
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  last_seen: string | null
}

const PROFILE_COLUMNS =
  'user_id, username, display_name, full_name, avatar_url, bio, is_verified, last_seen'

export const toPalProfile = (row: {
  user_id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean | null
  last_seen: string | null
}): PalProfile => ({
  id: row.user_id,
  username: row.username,
  name: row.display_name || row.full_name || row.username || 'Unknown',
  avatar_url: row.avatar_url,
  bio: row.bio,
  is_verified: row.is_verified ?? false,
  last_seen: row.last_seen
})

export const loadProfiles = async (
  client: SupabaseClient<Database>,
  ids: string[]
): Promise<Map<string, PalProfile>> => {
  if (!ids.length) return new Map()

  const { data } = await client.from('user').select(PROFILE_COLUMNS).in('user_id', ids)
  return new Map((data ?? []).map(row => [row.user_id, toPalProfile(row)]))
}

/** Ids the viewer has blocked or been blocked by; never surfaced anywhere. */
export const loadBlockedIds = async (
  client: SupabaseClient<Database>,
  userId: string
): Promise<Set<string>> => {
  const { data } = await client
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

  const ids = new Set<string>()
  for (const row of data ?? []) {
    if (row.blocker_id && row.blocker_id !== userId) ids.add(row.blocker_id)
    if (row.blocked_id && row.blocked_id !== userId) ids.add(row.blocked_id)
  }
  return ids
}

/** Accepted friends of a user. */
export const loadFriendIds = async (
  client: SupabaseClient<Database>,
  userId: string
): Promise<string[]> => {
  const { data } = await client
    .from('pals')
    .select('user_id, pal_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},pal_id.eq.${userId}`)

  return (data ?? []).map(row => (row.user_id === userId ? row.pal_id : row.user_id))
}
