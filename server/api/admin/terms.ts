export default defineEventHandler(async (event) => {
  const method = event.req.method
  const dbCollection = db.collection('termsAndPolicies')

  if (method === 'GET') {
    const terms = await dbCollection.find({}).toArray()
    return terms
  }

  if (method === 'POST') {
    const { feature, content, adminId } = await readBody(event)

    if (!feature || !content) {
      return {
        success: false,
        message: 'Feature and content are required.'
      }
    }

    const updatePayload = {
      content,
      lastUpdated: new Date(),
      updatedBy: adminId || 'system'
    }

    await dbCollection.updateOne(
      { feature },
      { $set: updatePayload },
      { upsert: true }
    )

    return {
      success: true,
      message: `Terms for '${feature}' updated.`,
      updated: updatePayload
    }
  }

  if (method === 'DELETE') {
    const { feature } = await readBody(event)

    if (!feature) {
      return {
        success: false,
        message: 'Feature name is required for deletion.'
      }
    }

    await dbCollection.deleteOne({ feature })

    return {
      success: true,
      message: `Terms for '${feature}' deleted.`
    }
  }

  return {
    success: false,
    message: 'Unsupported method.'
  }
})


