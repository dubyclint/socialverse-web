export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    return await db.collection('feeSettings').find({}).toArray()
  }

  if (event.req.method === 'POST') {
    const fee = await readBody(event)
    await db.collection('feeSettings').updateOne(
      { type: fee.type },
      { $set: fee },
      { upsert: true }
    )
    return { success: true }
  }
})
