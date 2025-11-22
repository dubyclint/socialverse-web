export default defineEventHandler(async (event) => {
  const { userId, action } = await readBody(event) // 'hide' or 'unhide'
  const user = await db.collection('users').findOne({ id: userId })
  const config = await db.collection('rankSettings').findOne({ key: 'hideDuration' }) || { value: 90 }

  if (!user?.premium) throw createError({ statusCode: 403, statusMessage: 'Not premium' })

  await db.collection('rankHideRequests').insertOne({
    userId,
    action,
    status: 'pending',
    feePaid: true,
    requestedAt: Date.now(),
    validUntil: Date.now() + config.value * 24 * 60 * 60 * 1000
  })

  return { success: true }
})
