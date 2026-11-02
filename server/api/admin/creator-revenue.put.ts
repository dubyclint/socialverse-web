import { readBody } from 'h3'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { loadCreatorRevenueConfig, revenueDb, type CreatorRevenueConfig } from '~/server/utils/creator-revenue'

const clamp = (v: unknown, min: number, max: number, field: string) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < min || n > max) throw createError({ statusCode: 400, statusMessage: `${field} must be between ${min} and ${max}` })
  return n
}

export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'admin')
  const body = await readBody<Partial<CreatorRevenueConfig>>(event)
  const cur = await loadCreatorRevenueConfig()
  const next: CreatorRevenueConfig = {
    creator_share_pct: body.creator_share_pct === undefined ? cur.creator_share_pct : clamp(body.creator_share_pct, 0, 100, 'Creator share'),
    internal_share_pct: body.internal_share_pct === undefined ? cur.internal_share_pct : clamp(body.internal_share_pct, 0, 100, 'Internal ad share'),
    platform_fund_cpm: body.platform_fund_cpm === undefined ? cur.platform_fund_cpm : clamp(body.platform_fund_cpm, 0, 1000, 'Platform fund CPM'),
    dau_gate: body.dau_gate === undefined ? cur.dau_gate : clamp(body.dau_gate, 0, 100_000_000, 'DAU gate'),
    engaged_seconds: body.engaged_seconds === undefined ? cur.engaged_seconds : clamp(body.engaged_seconds, 1, 120, 'Engaged seconds'),
    fill_timeout_ms: body.fill_timeout_ms === undefined ? cur.fill_timeout_ms : clamp(body.fill_timeout_ms, 500, 15000, 'Fill timeout'),
    view_padding: body.view_padding === undefined ? cur.view_padding : clamp(body.view_padding, 0, 100_000_000, 'View padding'),
    payout_period_days: body.payout_period_days === undefined ? cur.payout_period_days : clamp(body.payout_period_days, 1, 366, 'Payout period (days)'),
    payout_wallet_username: body.payout_wallet_username === undefined ? cur.payout_wallet_username : String(body.payout_wallet_username).trim().replace(/^@/, '').slice(0, 64),
    ecpm: { ...cur.ecpm }
  }
  for (const k of Object.keys(next.ecpm) as (keyof CreatorRevenueConfig['ecpm'])[]) {
    if (body.ecpm?.[k] !== undefined) next.ecpm[k] = clamp(body.ecpm[k], 0, 1000, `${k} eCPM`)
  }
  const { error } = await revenueDb().from('platform_configurations').upsert({ config_key: 'creator_revenue', config_values: next, updated_at: new Date().toISOString() }, { onConflict: 'config_key' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(staff.id, 'creator_revenue_update', 'platform_configurations', 'creator_revenue', next as unknown as Record<string, unknown>)
  return { config: next }
})
