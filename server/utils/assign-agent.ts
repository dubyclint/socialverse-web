export async function assignAgent(userRegion: string, feature: string) {
  const agents = await db.collection('supportAgents').find({
    active: true,
    assignedFeatures: feature,
    $or: [
      { region: userRegion },
      { region: 'Global' },
      { region: { $exists: false } }
    ]
  }).toArray()

  // Simple round-robin or random assignment
  return agents[Math.floor(Math.random() * agents.length)]
}
