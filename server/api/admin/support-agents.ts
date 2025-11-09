export default defineEventHandler(async (event) => {
  const method = event.req.method
  const dbCollection = db.collection('supportAgents')

  if (method === 'GET') {
    const { region, feature } = getQuery(event)
    const query: any = { active: true }

    if (region) query.region = region
    if (feature) query.assignedFeatures = feature

    return await dbCollection.find(query).toArray()
  }

  if (method === 'POST') {
    const agent = await readBody(event)

    if (!agent.agentId || !agent.name || !agent.method) {
      return { success: false, message: 'Missing required fields.' }
    }

    agent.lastSeen = new Date()

    await dbCollection.updateOne(
      { agentId: agent.agentId },
      { $set: agent },
      { upsert: true }
    )

    return { success: true, message: 'Agent saved.' }
  }

  if (method === 'DELETE') {
    const { agentId } = await readBody(event)
    await dbCollection.deleteOne({ agentId })
    return { success: true, message: 'Agent removed.' }
  }
})
