export default defineEventHandler(async (event) => {
  const method = event.req.method
  const dbSettings = db.collection('rankSettings')

  if (method === 'GET') {
    return await dbSettings.find().toArray()
  }

  const { key, value } = await readBody(event)
  await dbSettings.updateOne({ key }, { $set: { value } }, { upsert: true })

  return { success: true }
})
