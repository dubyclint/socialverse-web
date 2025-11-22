export default defineEventHandler(async (event) => {
  const method = event.req.method
  const dbCollection = db.collection('premiumAccessRules')

  if (method === 'GET') {
    const rules = await dbCollection.find({}).toArray()
    return rules
  }

  if (method === 'POST') {
    const rule = await readBody(event)

    if (!rule.target || !rule.value || !rule.features) {
      return { success: false, message: 'Missing required fields.' }
    }

    rule.updatedAt = new Date()
    rule.createdAt = rule.createdAt || new Date()

    await dbCollection.updateOne(
      { target: rule.target, value: rule.value },
      { $set: rule },
      { upsert: true }
    )

    return { success: true, message: 'Rule saved.' }
  }

  if (method === 'DELETE') {
    const { target, value } = await readBody(event)

    if (!target || !value) {
      return { success: false, message: 'Missing target or value.' }
    }

    await dbCollection.deleteOne({ target, value })
    return { success: true, message: 'Rule deleted.' }
  }

  return { success: false, message: 'Unsupported method.' }
})

