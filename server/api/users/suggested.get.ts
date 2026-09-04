import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Recommendations stay on while a user is still building a network. */
const RECOMMEND_BELOW_FOLLOWING = 100
const MIN_SUGGESTIONS = 2
const MAX_SUGGESTIONS = 5

const SCORE = {
  mutual: 40,
  contact: 35,
  location: 20,
  continent: 10,
  interest: 8,
  verified: 5
} as const

type Candidate = Database['public']['Tables']['user']['Row']

const continentOf = (location: string | null): string | null => {
  if (!location) return null
  const parts = location.split(',').map(p => p.trim()).filter(Boolean)
  return parts.length > 1 ? (parts[parts.length - 1] as string).toLowerCase() : null
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const limit = Math.min(
    Math.max(Number(getQuery(event).limit) || MAX_SUGGESTIONS, MIN_SUGGESTIONS),
    MAX_SUGGESTIONS
  )

  const client = await serverSupabaseClient<Database>(event)

  const { data: me } = await client
    .from('user')
    .select('user_id, location, interest_tags, following_count')
    .eq('user_id', user.id)
    .single()

  if (me && me.following_count >= RECOMMEND_BELOW_FOLLOWING) {
    return { success: true, data: [], reason: 'network_established' }
  }

  const [following, blocks, contacts] = await Promise.all([
    client.from('follows').select('following_id').eq('follower_id', user.id),
    client.from('user_blocks').select('blocked_id').eq('blocker_id', user.id),
    client.from('user_contacts').select('contact_id').eq('user_id', user.id).not('contact_id', 'is', null)
  ])

  const followingIds = (following.data ?? []).map(f => f.following_id)
  const contactIds = new Set((contacts.data ?? []).map(c => c.contact_id).filter((id): id is string => Boolean(id)))
  const blockedIds = (blocks.data ?? [])
    .map(b => b.blocked_id)
    .filter((id): id is string => Boolean(id))
  const excluded = new Set<string>([user.id, ...followingIds, ...blockedIds])

  // Friends-of-friends: the strongest in-app signal available on this schema.
  const { data: secondDegree } = followingIds.length
    ? await client.from('follows').select('following_id').in('follower_id', followingIds)
    : { data: [] as { following_id: string }[] }

  const mutualCount = new Map<string, number>()
  ;(secondDegree ?? []).forEach(f => {
    if (excluded.has(f.following_id)) return
    mutualCount.set(f.following_id, (mutualCount.get(f.following_id) ?? 0) + 1)
  })

  const candidateIds = [...new Set([...mutualCount.keys(), ...contactIds])].filter(id => !excluded.has(id))

  const [byRelation, popular] = await Promise.all([
    candidateIds.length
      ? client
          .from('user')
          .select('*')
          .in('user_id', candidateIds)
          .eq('is_banned', false)
          .limit(50)
      : Promise.resolve({ data: [] as Candidate[] }),
    client
      .from('user')
      .select('*')
      .eq('is_banned', false)
      .eq('is_private', false)
      .order('followers_count', { ascending: false })
      .limit(50)
  ])

  const pool = new Map<string, Candidate>()
  ;[...(byRelation.data ?? []), ...(popular.data ?? [])].forEach(candidate => {
    if (!excluded.has(candidate.user_id)) pool.set(candidate.user_id, candidate)
  })

  const myContinent = continentOf(me?.location ?? null)
  const myInterests = new Set(me?.interest_tags ?? [])

  const scored = [...pool.values()].map(candidate => {
    const mutuals = mutualCount.get(candidate.user_id) ?? 0
    const sharedInterests = (candidate.interest_tags ?? []).filter(tag => myInterests.has(tag)).length

    let score = mutuals * SCORE.mutual + sharedInterests * SCORE.interest
    if (contactIds.has(candidate.user_id)) score += SCORE.contact
    if (me?.location && candidate.location === me.location) score += SCORE.location
    else if (myContinent && continentOf(candidate.location) === myContinent) score += SCORE.continent
    if (candidate.is_verified) score += SCORE.verified

    return {
      id: candidate.user_id,
      username: candidate.username,
      full_name: candidate.display_name || candidate.username,
      avatar_url: candidate.avatar_url || '/default-avatar.svg',
      bio: candidate.bio ?? '',
      location: candidate.location,
      followers_count: candidate.followers_count,
      is_verified: candidate.is_verified ?? false,
      mutual_count: mutuals,
      shared_interests: sharedInterests,
      score
    }
  })

  scored.sort((a, b) => b.score - a.score || b.followers_count - a.followers_count)

  return { success: true, data: scored.slice(0, limit), total: scored.length }
})
