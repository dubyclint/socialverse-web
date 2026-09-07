import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

type UserRow = Database['public']['Tables']['user']['Row']

interface GroupMember {
  id: string
  username: string
  name: string
  avatar: string | null
  rank: string | null
  isVerified: boolean
  matchScore: number
}

interface MatchGroup {
  members: GroupMember[]
  groupScore: number
}

const RANK_VALUE: Record<string, number> = {
  Homie: 1,
  Pal: 2,
  Buddy: 3,
  Friend: 4,
  BestFriend: 5,
  Elite: 6
}

/** Affinity between two profiles from the columns the live schema actually has. */
const score = (viewer: UserRow, candidate: UserRow): number => {
  const viewerTags = new Set((viewer.interest_tags ?? []).map(tag => tag.toLowerCase()))
  const shared = (candidate.interest_tags ?? []).filter(tag => viewerTags.has(tag.toLowerCase()))

  let total = shared.length * 20
  if (viewer.location && viewer.location === candidate.location) total += 15
  if (candidate.is_verified) total += 25
  total += (RANK_VALUE[candidate.rank ?? 'Homie'] ?? 1) * 10
  total += Math.min(candidate.followers_count, 100) * 0.1

  return Math.round(Math.max(0, total))
}

const toMember = (row: UserRow, matchScore: number): GroupMember => ({
  id: row.user_id,
  username: row.username,
  name: row.full_name || row.display_name || row.username,
  avatar: row.avatar_url,
  rank: row.rank,
  isVerified: row.is_verified === true,
  matchScore
})

/**
 * Groups of compatible users built from live profiles: shared interest tags,
 * location, rank and verification. Existing pals, blocked users and the viewer
 * are excluded so a group is always something new to join.
 */
export default defineEventHandler(async (event): Promise<MatchGroup[]> => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient<Database>(event)
  const query = getQuery(event)

  const groupSize = Math.min(6, Math.max(3, Number(query.size) || 4))
  const region = typeof query.region === 'string' ? query.region : ''
  const category = typeof query.category === 'string' ? query.category : ''

  const [{ data: viewer }, { data: pals }, { data: blocks }] = await Promise.all([
    client.from('user').select('*').eq('user_id', user.id).maybeSingle(),
    client.from('pals').select('pal_id, user_id').or(`user_id.eq.${user.id},pal_id.eq.${user.id}`),
    client.from('user_blocks').select('blocked_id').eq('blocker_id', user.id)
  ])

  if (!viewer) return []

  const excluded = new Set<string>([user.id])
  for (const row of pals ?? []) {
    excluded.add(row.user_id === user.id ? row.pal_id : row.user_id)
  }
  for (const row of blocks ?? []) {
    if (row.blocked_id) excluded.add(row.blocked_id)
  }

  let candidateQuery = client
    .from('user')
    .select('*')
    .neq('user_id', user.id)
    .eq('is_banned', false)
    .limit(200)

  if (region) candidateQuery = candidateQuery.eq('location', region)
  if (category) candidateQuery = candidateQuery.contains('interest_tags', [category])

  const { data: candidates, error } = await candidateQuery
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const ranked = (candidates ?? [])
    .filter(row => !excluded.has(row.user_id))
    .map(row => ({ row, matchScore: score(viewer, row) }))
    .filter(entry => entry.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 30)

  const groups: MatchGroup[] = []
  for (let index = 0; index + groupSize <= ranked.length; index += groupSize) {
    const slice = ranked.slice(index, index + groupSize)
    groups.push({
      members: slice.map(entry => toMember(entry.row, entry.matchScore)),
      groupScore: slice.reduce((sum, entry) => sum + entry.matchScore, 0)
    })
  }

  return groups
})
