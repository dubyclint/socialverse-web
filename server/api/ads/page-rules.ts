export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    const name = getQuery(event).name
    const rule = await db.collection('adPageRules').findOne({ name })
    return rule || { name, allowed: {}, autoBoostEnabled: false }
  }

  if (event.req.method === 'POST') {
    const body = await readBody(event)
    await db.collection('adPageRules').updateOne(
      { name: body.name },
      { $set: body },
      { upsert: true }
    )
    return { success: true }
  }
})
