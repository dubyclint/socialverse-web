import { supabase } from "~/server/utils/database"
import { MatchScore } from '~/server/utils/match-score'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const { size = 4, region, category, overrideGroup } = getQuery(event)

  // Admin override: force group by IDs
  if (overrideGroup) {
    const ids = overrideGroup.split(',').map(id => id.trim())
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', ids)

    return [{
      members: users?.map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        rank: u.rank,
        isVerified: u.isVerified,
        matchScore: computeMatchScore(user, u)
      })) || [],
      groupScore: users?.reduce((acc, u) => acc + computeMatchScore(user, u), 0) || 0,
      override: true
    }]
  }

  // Standard matching flow
  let query = supabase
    .from('users')
    .select('*')
    .neq('id', user.id)

  if (region) {
    query = query.eq('location', region)
  }
  
  if (category) {
    query = query.contains('trade_interests', [category])
  }

  const { data: allUsers } = await query

  const scored = allUsers?.map(u => ({
    ...u,
    matchScore: computeMatchScore(user, u)
  })).filter(u => u.matchScore > 30) || []

  let topCandidates = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 30)

  const groups = []
  while (topCandidates.length >= size - 1) {
    const seed = topCandidates.shift()
    const compatible = topCandidates.filter(u =>
      computeMatchScore(seed, u) > 25 &&
      !user.pals?.includes(u.id) &&
      !seed.pals?.includes(u.id)
    ).slice(0, size - 1)

    if (compatible.length >= size - 1) {
      groups.push([seed, ...compatible])
      topCandidates = topCandidates.filter(u => !compatible.includes(u))
    }
  }

  return groups.map(group => ({
    members: group.map(u => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      rank: u.rank,
      isVerified: u.isVerified,
      matchScore: u.matchScore
    })),
    groupScore: group.reduce((acc, u) => acc + u.matchScore, 0),
    filtersApplied: {
      size: Number(size),
      region: region || 'Any',
      category: category || 'Any'
    }
  }))
})
