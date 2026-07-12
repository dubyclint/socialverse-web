import { getSupabaseClient } from "~/server/utils/database"
import { computeMatchScore } from '~/server/utils/match-score'

export default defineEventHandler(async (event) => {
  const supabase = await getSupabaseClient()
  const user = event.context.user
  const { size = 4, region, category, overrideGroup } = getQuery(event)

  // Admin override: force group by IDs
  if (overrideGroup) {
  const ids = overrideGroup.split(',').map((id: string) => id.trim())
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', ids)

    return [{
      members: users?.map((u: any) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        rank: u.rank,
        isVerified: u.isVerified,
        matchScore: computeMatchScore(user, u)
      })) || [],
      groupScore: users?.reduce((acc: number, u: any) => acc + computeMatchScore(user, u), 0) || 0,
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

  const scored = allUsers?.map((u: any) => ({
    ...u,
    matchScore: computeMatchScore(user, u)
  })).filter((u: any) => u.matchScore > 30) || []

  let topCandidates = scored.sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, 30)

  const groups = []
  while (topCandidates.length >= size - 1) {
    const seed: any = topCandidates.shift()
    const compatible = topCandidates.filter((u: any) =>
      computeMatchScore(seed, u) > 25 &&
      !user.pals?.includes(u.id) &&
      !seed.pals?.includes(u.id)
    ).slice(0, size - 1)

    if (compatible.length >= size - 1) {
  groups.push([seed, ...compatible])
  topCandidates = topCandidates.filter((u: any) => !compatible.includes(u))
    }
  }

  return groups.map((group: any) => ({
    members: group.map((u: any) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      rank: u.rank,
      isVerified: u.isVerified,
      matchScore: u.matchScore
    })),
    groupScore: group.reduce((acc: number, u: any) => acc + u.matchScore, 0),
    filtersApplied: {
      size: Number(size),
      region: region || 'Any',
      category: category || 'Any'
    }
  }))
})
