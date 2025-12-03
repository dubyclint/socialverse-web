// ============================================================================
// FILE: /server/api/admin/ml/algorithm-config.put.ts - CORRECTED VERSION
// ============================================================================
// ML ALGORITHM CONFIGURATION ENDPOINT
// FIXED: Removed @supabase/nuxt import - uses getSupabaseAdminClient instead
// ============================================================================

import { defineEventHandler, readBody, createError } from 'h3'
import { getSupabaseAdminClient } from '~/server/utils/database'
import type { H3Event } from 'h3'

// ============================================================================
// TYPES
// ============================================================================

interface AuthenticatedUser {
  id: string
  is_admin: boolean
}

interface AlgorithmConfig {
  explorationRate: number
  ghostAdRate: number
  maxAdsPerFeed: number
  diversityWeight: number
  engagementWeight: number
  revenueWeight: number
  qualityThreshold: number
  maxCandidates: number
  finalFeedSize: number
}

interface MLAlgorithmConfigRow {
  config_name: string
  config_data: AlgorithmConfig
  version: number
  is_active: boolean
  created_by: string
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Get authenticated user from event context
 */
async function requireAuthenticatedUser(event: H3Event): Promise<AuthenticatedUser> {
  try {
    // Get user from event context (set by auth middleware)
    const user = event.context.user
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No user in context'
      })
    }

    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden - Admin access required'
      })
    }

    return user as AuthenticatedUser
  } catch (error) {
    if (error instanceof Error && error.message.includes('statusCode')) {
      throw error
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication failed'
    })
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

type ConfigRule = {
  min: number
  max: number
  type: 'number' | 'integer'
}

const CONFIG_SCHEMA: Record<keyof AlgorithmConfig, ConfigRule> = {
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

/**
 * Validate algorithm configuration
 */
function validateAlgorithmConfig(config: unknown): AlgorithmConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Configuration must be an object')
  }

  const validated: Partial<AlgorithmConfig> = {}

  for (const [key, rules] of Object.entries(CONFIG_SCHEMA)) {
    const value = (config as Record<string, unknown>)[key]

    if (value === undefined || value === null) {
      throw new Error(`Missing required field: ${key}`)
    }

    if (rules.type === 'number') {
      if (typeof value !== 'number') {
        throw new Error(`${key} must be a number`)
      }
    } else if (rules.type === 'integer') {
      if (!Number.isInteger(value)) {
        throw new Error(`${key} must be an integer`)
      }
    }

    if (value < rules.min || value > rules.max) {
      throw new Error(`${key} must be between ${rules.min} and ${rules.max}`)
    }

    validated[key as keyof AlgorithmConfig] = value as number
  }

  // Cast now that all fields are validated
  const fullConfig = validated as AlgorithmConfig

  // Validate weight sum
  const totalWeight =
    fullConfig.engagementWeight +
    fullConfig.revenueWeight +
    fullConfig.diversityWeight

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new Error(
      'Algorithm weights (engagement, revenue, diversity) must sum to 1.0'
    )
  }

  return fullConfig
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Notify ML service of configuration change
 */
async function notifyMLServiceConfigChange(
  configType: string,
  newConfig: AlgorithmConfig
): Promise<void> {
  try {
    console.log(`[MLConfig] Config updated: ${configType}`, newConfig)

    // In production, notify via:
    // - Redis pub/sub
    // - HTTP webhook
    // - Message queue (RabbitMQ, SQS, etc.)
    // - WebSocket broadcast

    // Example Redis notification (uncomment when implemented):
    // const redis = useRedis()
    // await redis.publish('ml-config-update', JSON.stringify({
    //   type: configType,
    //   config: newConfig,
    //   timestamp: new Date().toISOString()
    // }))
  } catch (error) {
    console.error('[MLConfig] Notification error:', error)
    // Don't throw - notification failure shouldn't block config update
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    console.log('[MLConfig] PUT request received')

    // Authenticate user
    const user = await requireAuthenticatedUser(event)
    console.log(`[MLConfig] Admin user authenticated: ${user.id}`)

    // Read request body
    const body = await readBody(event)
    console.log('[MLConfig] Request body received')

    // Validate configuration
    const validatedConfig = validateAlgorithmConfig(body)
    console.log('[MLConfig] Configuration validated')

    // Get Supabase admin client
    const supabase = await getSupabaseAdminClient()

    // Get current active config version
    const { data: currentConfig, error: selectError } = await supabase
      .from('ml_algorithm_config')
      .select('version')
      .eq('config_name', 'default_algorithm_config')
      .eq('is_active', true)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = "Not found" – acceptable if no config exists yet
      console.error('[MLConfig] Select error:', selectError)
      throw selectError
    }

    const newVersion = (currentConfig?.version || 0) + 1
    console.log(`[MLConfig] New version: ${newVersion}`)

    // Deactivate current config (if any)
    if (currentConfig) {
      const { error: updateError } = await supabase
        .from('ml_algorithm_config')
        .update({ is_active: false })
        .eq('config_name', 'default_algorithm_config')
        .eq('is_active', true)

      if (updateError) {
        console.error('[MLConfig] Deactivate error:', updateError)
        throw updateError
      }
      console.log('[MLConfig] Previous config deactivated')
    }

    // Insert new config
    const { error: insertError } = await supabase
      .from('ml_algorithm_config')
      .insert({
        config_name: 'default_algorithm_config',
        config_data: validatedConfig,
        version: newVersion,
        is_active: true,
        created_by: user.id,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('[MLConfig] Insert error:', insertError)
      throw insertError
    }

    console.log('[MLConfig] New config inserted')

    // Notify ML service
    await notifyMLServiceConfigChange('algorithm', validatedConfig)

    console.log('[MLConfig] Configuration update completed successfully')

    return {
      success: true,
      version: newVersion,
      message: 'Algorithm configuration updated successfully'
    }
  } catch (error: unknown) {
    console.error('[MLConfig] Error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update algorithm configuration'

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
