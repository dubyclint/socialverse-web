export default defineEventHandler(async (event) => {
  const { adId, userId, action } = await readBody(event)

  await db.collection('adConversions').insertOne({
    adId,
    userId,
    action,
    timestamp: Date.now()
  })

  return { success: true }
})
