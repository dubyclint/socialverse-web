// Track user interactions for ML learning
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    const body = await readBody(event)
    
    const supabase = serverSupabaseServiceRole(event)

    // Validate interaction data
    const interaction = validateInteraction(body)
    
    // Store interaction
    const { error } = await supabase
      .from('user_interactions')
      .insert({
        user_id: user.id,
        item_id: interaction.itemId,
        item_type: interaction.itemType,
        interaction_type: interaction.type,
        duration_seconds: interaction.duration,
        position_in_feed: interaction.position,
        device_type: interaction.deviceType,
        session_id: interaction.sessionId,
        feed_generation_id: interaction.feedGenerationId
      })

    if (error) throw error

    // Update real-time features if significant interaction
    if (['click', 'like', 'share', 'conversion'].includes(interaction.type)) {
      await updateUserFeatures(user.id, interaction)
    }

    // Handle ad interactions specially
    if (interaction.itemType === 'ad') {
      await handleAdInteraction(user.id, interaction)
    }

    // Update bandit rewards for exploration learning
    if (interaction.banditContext) {
      await updateBanditReward(interaction.banditContext, interaction)
    }

    return { success: true }

  } catch (error) {
    console.error('Interaction tracking error:', error)
    return { success: false, error: error.message }
  }
})

function validateInteraction(data) {
  const required = ['itemId', 'itemType', 'type']
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  const validTypes = ['view', 'click', 'like', 'share', 'comment', 'conversion', 'skip']
  if (!validTypes.includes(data.type)) {
    throw new Error(`Invalid interaction type: ${data.type}`)
  }

  return {
    itemId: data.itemId,
    itemType: data.itemType,
    type: data.type,
    duration: Math.max(0, parseInt(data.duration) || 0),
    position: parseInt(data.position) || 0,
    deviceType: data.deviceType || 'unknown',
    sessionId: data.sessionId,
    feedGenerationId: data.feedGenerationId,
    banditContext: data.banditContext
  }
}

async function updateUserFeatures(userId, interaction) {
  // Update user features in Redis for real-time learning
  const redis = new Redis(process.env.REDIS_URL)
  
  const key = `user_features:${userId}`
  const features = await redis.get(key)
  
  if (features) {
    const parsed = JSON.parse(features)
    
    // Update interaction counters
    if (interaction.type === 'click') {
      parsed.clicks_today = (parsed.clicks_today || 0) + 1
    }
    if (interaction.type === 'like') {
      parsed.likes_today = (parsed.likes_today || 0) + 1
    }
    
    // Update last activity
    parsed.last_activity = new Date().toISOString()
    
    await redis.setex(key, 3600, JSON.stringify(parsed))
  }
}

async function handleAdInteraction(userId, interaction) {
  const supabase = serverSupabaseServiceRole(event)
  
  // Log ad interaction for auction optimization
  await supabase
    .from('ad_spend_log')
    .insert({
      campaign_id: interaction.campaignId,
      ad_id: interaction.itemId,
      amount: interaction.type === 'click' ? interaction.cpc || 0 : 0,
      event_type: interaction.type,
      user_id: userId
    })

  // Update frequency caps
  if (interaction.type === 'view') {
    await supabase.rpc('increment_ad_frequency', {
      user_id: userId,
      campaign_id: interaction.campaignId
    })
  }

  // Record for causal inference if in experiment
  if (interaction.experimentId) {
    await supabase
      .from('incrementality_events')
      .insert({
        experiment_id: interaction.experimentId,
        user_id: userId,
        campaign_id: interaction.campaignId,
        assignment: interaction.experimentAssignment,
        event_type: interaction.type,
        conversion_value: interaction.conversionValue || 0
      })
  }
}

async function updateBanditReward(banditContext, interaction) {
  // Calculate reward based on interaction type
  const rewardMap = {
    'view': 0.1,
    'click': 1.0,
    'like': 0.8,
    'share': 1.5,
    'comment': 1.2,
    'conversion': 5.0,
    'skip': -0.1
  }
  
  const reward = rewardMap[interaction.type] || 0
  
  // Update bandit with reward
  const redis = new Redis(process.env.REDIS_URL)
  await redis.lpush('bandit_updates', JSON.stringify({
    contextId: banditContext.contextId,
    armId: banditContext.armId,
    reward,
    timestamp: Date.now()
  }))
}
