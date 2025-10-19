// API endpoint to update algorithm configuration
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const supabase = serverSupabaseServiceRole(event)

    // Validate configuration
    const validatedConfig = validateAlgorithmConfig(body)

    // Create new version of configuration
    const { data: currentConfig } = await supabase
      .from('ml_algorithm_config')
      .select('version')
      .eq('config_name', 'default_algorithm_config')
      .eq('is_active', true)
      .single()

    const newVersion = (currentConfig?.version || 0) + 1

    // Deactivate current config
    await supabase
      .from('ml_algorithm_config')
      .update({ is_active: false })
      .eq('config_name', 'default_algorithm_config')
      .eq('is_active', true)

    // Insert new config
    const { error } = await supabase
      .from('ml_algorithm_config')
      .insert({
        config_name: 'default_algorithm_config',
        config_data: validatedConfig,
        version: newVersion,
        is_active: true,
        created_by: user.id
      })

    if (error) throw error

    // Notify ML service of configuration change
    await notifyMLServiceConfigChange('algorithm', validatedConfig)

    return { success: true, version: newVersion }

  } catch (error) {
    console.error('Algorithm config update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update algorithm configuration'
    })
  }
})

function validateAlgorithmConfig(config) {
  const schema = {
    explorationRate: { min: 0, max: 0.5, type: 'number' },
    ghostAdRate: { min: 0, max: 0.2, type: 'number' },
    maxAdsPerFeed: { min: 1, max: 10, type: 'integer' },
    diversityWeight: { min: 0, max: 1, type: 'number' },
    engagementWeight: { min: 0, max: 1, type: 'number' },
    revenueWeight: { min: 0, max: 1, type: 'number' },
    qualityThreshold: { min: 0, max: 1, type: 'number' },
    maxCandidates: { min: 100, max: 5000, type: 'integer' },
    finalFeedSize: { min: 10, max: 200, type: 'integer' }
  }

  const validated = {}

  for (const [key, rules] of Object.entries(schema)) {
    const value = config[key]
    
    if (value === undefined || value === null) {
      throw new Error(`Missing required field: ${key}`)
    }

    if (rules.type === 'number' && typeof value !== 'number') {
      throw new Error(`${key} must be a number`)
    }

    if (rules.type === 'integer' && (!Number.isInteger(value))) {
      throw new Error(`${key} must be an integer`)
    }

    if (value < rules.min || value > rules.max) {
      throw new Error(`${key} must be between ${rules.min} and ${rules.max}`)
    }

    validated[key] = value
  }

  // Validate weight sum
  const totalWeight = validated.engagementWeight + validated.revenueWeight + validated.diversityWeight
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new Error('Algorithm weights must sum to 1.0')
  }

  return validated
}

async function notifyMLServiceConfigChange(configType, newConfig) {
  // In production, this would notify the ML service via Redis pub/sub or HTTP
  console.log(`ML Config updated: ${configType}`, newConfig)
  
  // Example: Redis notification
  // const redis = new Redis(process.env.REDIS_URL)
  // await redis.publish('ml-config-update', JSON.stringify({
  //   type: configType,
  //   config: newConfig,
  //   timestamp: new Date().toISOString()
  // }))
}
