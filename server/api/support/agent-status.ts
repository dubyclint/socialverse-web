// Minimal in-memory fallback DB used during type remediation.
const agentStatusStore = new Map<string, any>()

export default defineEventHandler(async (event) => {
  const method = event.req.method

  if (method === 'GET') {
    const results = Array.from(agentStatusStore.values()).filter(s => s.online)
    return results
  }

  if (method === 'POST') {
    const status = await readBody(event)
    status.lastSeen = new Date()
    agentStatusStore.set(status.agentId, status)
    return { success: true }
  }

  if (method === 'GET' && getQuery(event).queue === 'true') {
    const results = Array.from(agentStatusStore.values()).filter(s => s.online && (s.currentSessions || 0) < (s.maxSessions || 0))
    return results
  }

  // default: return empty array to satisfy handlers
  return []
})
