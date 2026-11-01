import { getServiceClient } from '~/server/utils/supabase-admin'

export interface VeepSettings { standard_s: number, engaged_s: number, high_s: number, monetize_views: number, monetize_days: number }
export const DEFAULT_VEEP: VeepSettings = { standard_s: 5, engaged_s: 25, high_s: 1800, monetize_views: 200000, monetize_days: 30 }

export const getVeepSettings = async (): Promise<VeepSettings> => {
  const { data } = await getServiceClient().from('platform_configurations').select('config_values').eq('config_key', 'veep_settings').maybeSingle()
  const v = (data?.config_values ?? {}) as Partial<VeepSettings>
  const out = { ...DEFAULT_VEEP }
  for (const k of Object.keys(out) as (keyof VeepSettings)[]) {
    const n = Number(v[k]); if (Number.isFinite(n) && n > 0) out[k] = n
  }
  return out
}

export const VIDEO_RE = /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i
export const isVideo = (url: string) => VIDEO_RE.test(url)
