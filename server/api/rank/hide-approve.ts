export default defineEventHandler(async (event) => {
  const { userId, approve } = await readBody(event)
  const request = await db.collection('rankHideRequests').findOne({ userId, status: 'pending' })

  if (!request) throw createError({ statusCode: 404, statusMessage: 'No pending request' })

  await db.collection('rankHideRequests').updateOne({ userId }, { $set: { status: approve ? 'approved' : 'rejected' } })

  if (approve) {
    await db.collection('users').updateOne({ id: userId }, {
      $set: {
        canToggleRank: true,
        rankToggleExpires: request.validUntil
      }
    })
  }

  return { success: true }
})
