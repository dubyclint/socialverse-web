// server/api/admin/algorithm-config.put.ts
import { defineEventHandler, readBody, createError } from 'h3';
import { serverSupabaseServiceRole } from '@supabase/nuxt';
import type { H3Event } from 'h3';

// Types
interface AuthenticatedUser {
  id: string;
  is_admin: boolean;
  // Add other user fields as needed
}

interface AlgorithmConfig {
  explorationRate: number;
  ghostAdRate: number;
  maxAdsPerFeed: number;
  diversityWeight: number;
  engagementWeight: number;
  revenueWeight: number;
  qualityThreshold: number;
  maxCandidates: number;
  finalFeedSize: number;
}

interface MLAlgorithmConfigRow {
  config_name: string;
  config_data: AlgorithmConfig;
  version: number;
  is_active: boolean;
  created_by: string;
}

// Mock or import your auth utility
async function requireAuthenticatedUser(event: H3Event): Promise<AuthenticatedUser> {
  // Replace with your real auth logic
  const user = event.context.user; // Example — adapt to your auth system
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  return user as AuthenticatedUser;
}

// Validation schema type
type ConfigRule = {
  min: number;
  max: number;
  type: 'number' | 'integer';
};

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
};

function validateAlgorithmConfig(config: unknown): AlgorithmConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Configuration must be an object');
  }

  const validated: Partial<AlgorithmConfig> = {};

  for (const [key, rules] of Object.entries(CONFIG_SCHEMA)) {
    const value = (config as Record<string, unknown>)[key];

    if (value === undefined || value === null) {
      throw new Error(`Missing required field: ${key}`);
    }

    if (rules.type === 'number') {
      if (typeof value !== 'number') {
        throw new Error(`${key} must be a number`);
      }
    } else if (rules.type === 'integer') {
      if (!Number.isInteger(value)) {
        throw new Error(`${key} must be an integer`);
      }
    }

    if (value < rules.min || value > rules.max) {
      throw new Error(`${key} must be between ${rules.min} and ${rules.max}`);
    }

    validated[key as keyof AlgorithmConfig] = value as number;
  }

  // Cast now that all fields are validated
  const fullConfig = validated as AlgorithmConfig;

  // Validate weight sum
  const totalWeight =
    fullConfig.engagementWeight +
    fullConfig.revenueWeight +
    fullConfig.diversityWeight;

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new Error('Algorithm weights (engagement, revenue, diversity) must sum to 1.0');
  }

  return fullConfig;
}

async function notifyMLServiceConfigChange(configType: string, newConfig: AlgorithmConfig): Promise<void> {
  // In production, notify via Redis, HTTP webhook, etc.
  console.log(`ML Config updated: ${configType}`, newConfig);

  // Example Redis notification (uncomment when implemented):
  // const redis = useRedis(); // or however you access Redis
  // await redis.publish('ml-config-update', JSON.stringify({
  //   type: configType,
  //   config: newConfig,
  //   timestamp: new Date().toISOString()
  // }));
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event);
    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      });
    }

    const body = await readBody(event);
    const supabase = serverSupabaseServiceRole(event);

    // Validate configuration
    const validatedConfig = validateAlgorithmConfig(body);

    // Get current active config version
    const { data: currentConfig, error: selectError } = await supabase
      .from('ml_algorithm_config')
      .select('version')
      .eq('config_name', 'default_algorithm_config')
      .eq('is_active', true)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = "Not found" – acceptable if no config exists yet
      throw selectError;
    }

    const newVersion = (currentConfig?.version || 0) + 1;

    // Deactivate current config (if any)
    await supabase
      .from('ml_algorithm_config')
      .update({ is_active: false })
      .eq('config_name', 'default_algorithm_config')
      .eq('is_active', true);

    // Insert new config
    const { error: insertError } = await supabase
      .from('ml_algorithm_config')
      .insert({
        config_name: 'default_algorithm_config',
        config_data: validatedConfig,
        version: newVersion,
        is_active: true,
        created_by: user.id
      });

    if (insertError) throw insertError;

    // Notify ML service
    await notifyMLServiceConfigChange('algorithm', validatedConfig);

    return { success: true, version: newVersion };
  } catch (error: unknown) {
    console.error('Algorithm config update error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update algorithm configuration'
    });
  }
});
