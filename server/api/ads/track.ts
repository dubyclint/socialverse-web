export default defineEventHandler(async (event) => {
  const { adId, action, variant, page } = await readBody(event)
  const userId = event.context.user.id

  const entry: any = {
    adId,
    userId,
    action,
    timestamp: Date.now()
  }

  if (action === 'variant') {
    entry.variant = variant
    entry.page = page
  }

  await db.collection('adMetrics').insertOne(entry)
  return { success: true }
})

