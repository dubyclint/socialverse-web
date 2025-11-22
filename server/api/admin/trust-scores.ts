import { evaluateTrust } from '~/server/utils/evaluate-trust'

export default defineEventHandler(async () => {
  const users = await db.collection('users').find().toArray()

  const scored = users.map(user => {
    const trust = evaluateTrust(user)
    return {
      id: user._id,
      username: user.username,
      country: user.country,
      region: user.region,
      isVerified: user.isVerified,
      kycVerified: user.kycVerified,
      isPremium: user.isPremium,
      trustScore: trust.priorityRatio,
      criteriaMet: trust.criteriaMet,
      isTrusted: trust.isTrusted
    }
  })

  return scored.sort((a, b) => b.trustScore - a.trustScore)
})
