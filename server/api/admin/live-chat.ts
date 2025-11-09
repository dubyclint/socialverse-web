export default defineEventHandler(async (event) => {
  const method = event.req.method
  const dbCollection = db.collection('liveChatConfig')

  if (method === 'GET') {
    return await dbCollection.find({ active: true }).toArray()
  }

  if (method === 'POST') {
    const config = await readBody(event)
    config.updatedAt = new Date()

    await dbCollection.updateOne(
      { label: config.label },
      { $set: config },
      { upsert: true }
    )

    return { success: true, message: 'Live chat config saved.' }
  }

  if (method === 'DELETE') {
    const { label } = await readBody(event)
    await dbCollection.deleteOne({ label })
    return { success: true, message: 'Live chat config deleted.' }
  }
})
