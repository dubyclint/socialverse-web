import { getServiceClient } from '~/server/utils/supabase-admin'

export interface StatusSettings { duration_hours: number }
export const DEFAULT_STATUS_SETTINGS: StatusSettings = { duration_hours: 24 }
export const STATUS_DURATION_LIMITS = { min: 1, max: 168 }

export const getStatusSettings = async (): Promise<StatusSettings> => {
  const { data } = await getServiceClient()
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', 'status_settings')
    .maybeSingle()
  const hours = Number((data?.config_values as Record<string, unknown> | null)?.duration_hours)
  return {
    duration_hours: Number.isFinite(hours) && hours >= STATUS_DURATION_LIMITS.min && hours <= STATUS_DURATION_LIMITS.max
      ? hours
      : DEFAULT_STATUS_SETTINGS.duration_hours
  }
}
