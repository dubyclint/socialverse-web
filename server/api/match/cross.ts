import { computeMatchScore } from '~/server/utils/match-score'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const memory = await db.collection('users').findOne({ _id: user.id }, {
    projection: {
      recentMatches: 1,
      skippedMatches: 1,
      acceptedMatches: 1,
      chattedWith: 1
    }
  })

  const allUsers = await db.collection('users').find({ _id: { $ne: user.id } }).toArray()

  const scored = allUsers.map(u => ({
    ...u,
    matchScore: computeMatchScore(user, u)
  })).filter(u =>
    u.matchScore > 30 &&
    !memory.recentMatches?.includes(u.id) &&
    !memory.skippedMatches?.includes(u.id)
  )

  const sorted = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10)

  return sorted.map(u => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    rank: u.rank,
    isVerified: u.isVerified,
    matchScore: u.matchScore,
    seenBefore: memory.acceptedMatches?.includes(u.id) || memory.chattedWith?.includes(u.id)
  }))
})
