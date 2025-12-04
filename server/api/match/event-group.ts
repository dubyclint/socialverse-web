import { getSupabaseClient } from "~/server/utils/database"
import { computeMatchScore } from '~/server/utils/match-score'
import { sendNotification } from '~/server/utils/send-notification'
import { sendPushAlert } from '~/server/utils/send-push-alert'

export default defineEventHandler(async (event) => {
  const supabase = await getSupabaseClient()
  const user = event.context.user
  const { eventId } = getQuery(event)

  const { data: eventMeta } = await supabase
    .from('match_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!eventMeta) return []

  const { region, category, size = 4, verified_only: verifiedOnly, title } = eventMeta

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

  if (verifiedOnly) {
    query = query.eq('is_verified', true)
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
      !user.pals?.includes(u.id)
    ).slice(0, size - 1)

    if (compatible.length >= size - 1) {
      groups.push([seed, ...compatible])
      topCandidates = topCandidates.filter(u => !compatible.includes(u))
    }
  }

  if (groups.length > 0) {
    await sendNotification(user.id, 'group', `You've been matched for ${title}.`)
    await sendPushAlert(user.id, 'Group Match Ready', `You're matched for ${title}.`)
  }

  return groups.map(group => ({
    eventId,
    members: group.map(u => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      rank: u.rank,
      isVerified: u.isVerified,
      matchScore: u.matchScore
    })),
    groupScore: group.reduce((acc, u) => acc + u.matchScore, 0)
  }))
})


