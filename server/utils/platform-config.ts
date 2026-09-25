import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

type Client = SupabaseClient<Database>

export const loadConfig = async <T>(
  client: Client,
  key: string,
  fallback: T
): Promise<T> => {
  const { data } = await client
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', key)
    .maybeSingle()

  if (!data?.config_values || typeof data.config_values !== 'object') return fallback
  return { ...fallback, ...(data.config_values as Record<string, unknown>) } as T
}
