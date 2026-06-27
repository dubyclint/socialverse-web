import { computeMatchScore } from '~/server/utils/match-score'
import { sendNotification } from '~/server/utils/send-notification'
import { sendPushAlert } from '~/server/utils/send-push-alert'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const memory = await db.collection('users').findOne({ _id: user.id })

  const candidateIds = [
    ...(memory.skippedMatches || []),
    ...(memory.recentMatches || [])
  ]

  const candidates = await db.collection('users').find({
    _id: { $in: candidateIds }
  }).toArray()

  const improved = candidates.map(u => ({
    ...u,
    matchScore: computeMatchScore(user, u)
  })).filter(u => u.matchScore > 40)

  if (improved.length > 0) {
    await sendNotification(user.id, 'rematch', 'New re-match suggestions are ready.')
    await sendPushAlert(user.id, 'New Re-Match Available', 'Tap to view your updated suggestions.')
  }

  return improved.map(u => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    rank: u.rank,
    isVerified: u.isVerified,
    matchScore: u.matchScore,
    reason: 'Improved compatibility'
  }))
})

