import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceClient } from '~/server/utils/supabase-admin'

export type AdType = 'interstitial' | 'rewarded' | 'native_banner' | 'house_ad'
export interface CreatorRevenueConfig {
  creator_share_pct: number
  internal_share_pct: number
  platform_fund_cpm: number
  ecpm: Record<AdType, number>
  dau_gate: number
  engaged_seconds: number
  fill_timeout_ms: number
  view_padding: number
  payout_period_days: number
  payout_wallet_username: string
}
export const DEFAULT_CREATOR_REVENUE: CreatorRevenueConfig = {
  creator_share_pct: 60,
  internal_share_pct: 60,
  platform_fund_cpm: 0,
  ecpm: { interstitial: 2, rewarded: 3, native_banner: 1.5, house_ad: 1 },
  dau_gate: 10000,
  engaged_seconds: 6,
  fill_timeout_ms: 3500,
  view_padding: 0,
  payout_period_days: 7,
  payout_wallet_username: 'paul'
}

export const revenueDb = () => getServiceClient() as unknown as SupabaseClient

export const loadCreatorRevenueConfig = async (): Promise<CreatorRevenueConfig> => {
  const { data } = await revenueDb().from('platform_configurations').select('config_values').eq('config_key', 'creator_revenue').maybeSingle()
  const v = (data?.config_values ?? {}) as Partial<CreatorRevenueConfig>
  return { ...DEFAULT_CREATOR_REVENUE, ...v, ecpm: { ...DEFAULT_CREATOR_REVENUE.ecpm, ...(v.ecpm ?? {}) } }
}

/** Rolling 24h DAU: distinct users with a presence heartbeat in the last day. */
export const currentDau = async () => {
  const { count } = await revenueDb().from('user_presence').select('user_id', { count: 'exact', head: true })
    .gte('updated_at', new Date(Date.now() - 86400_000).toISOString())
  return count ?? 0
}

/**
 * Per-view credit, 8-decimal precision done in integer micro-units (1e-8) to avoid float drift:
 * single_view_revenue = eCPM / 1000; creator credit = single_view_revenue * share.
 */
export const viewCredit = (ecpm: number, sharePct: number) => {
  const revenueUnits = BigInt(Math.round(ecpm * 1e8)) / 1000n
  const creditUnits = (revenueUnits * BigInt(Math.round(sharePct * 100))) / 10000n
  return { raw: Number(revenueUnits) / 1e8, credit: Number(creditUnits) / 1e8 }
}
