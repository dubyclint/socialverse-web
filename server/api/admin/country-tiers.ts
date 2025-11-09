export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    return await db.collection('countryTiers').find({}).toArray()
  }

  if (event.req.method === 'POST') {
    const { country, tier } = await readBody(event)
    await db.collection('countryTiers').updateOne(
      { country },
      { $set: { tier } },
      { upsert: true }
    )
    return { success: true }
  }
})
