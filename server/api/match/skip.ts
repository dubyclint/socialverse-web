import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { userId } = await readBody(event)

  await db.collection('users').updateOne(
    { _id: user.id },
    {
      $addToSet: {
        recentMatches: userId,
        skippedMatches: userId
      }
    }
  )

  return { success: true }
})
