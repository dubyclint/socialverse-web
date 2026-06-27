export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.isAdmin) throw createError({ statusCode: 403 })

  const { platform, config } = await readBody(event)

  await db.collection('externalAdSources').updateOne(
    { platform },
    { $set: { config, updatedAt: Date.now() } },
    { upsert: true }
  )

  return { success: true }
})
