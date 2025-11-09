export default defineEventHandler(async (event) => {
  const method = event.req.method
  const db = db.collection('agentStatus')

  if (method === 'GET') {
    return await db.find({ online: true }).toArray()
  }

  if (method === 'POST') {
    const status = await readBody(event)
    status.lastSeen = new Date()

    await db.updateOne(
      { agentId: status.agentId },
      { $set: status },
      { upsert: true }
    )

    return { success: true }
  }

  if (method === 'GET' && getQuery(event).queue === 'true') {
    return await db.find({
      online: true,
      $expr: { $lt: ['$currentSessions', '$maxSessions'] }
    }).toArray()
  }
})
