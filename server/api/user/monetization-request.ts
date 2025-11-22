export default defineEventHandler(async (event) => {
  const user = event.context.user
  const existing = await db.collection('monetizationRequests').findOne({ userId: user.id })

  if (existing) return { status: existing.status }

  await db.collection('monetizationRequests').insertOne({
    userId: user.id,
    status: 'pending',
    tier: user.tier,
    submittedAt: new Date()
  })

  return { status: 'pending' }
})
