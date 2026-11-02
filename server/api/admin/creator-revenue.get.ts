import { requireStaff } from '~/server/utils/staff'
import { currentDau, loadCreatorRevenueConfig, revenueDb } from '~/server/utils/creator-revenue'

/** Admin: revenue-share config, DAU gate status, render-rate and fill-failure diagnostics. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'admin')
  const db = revenueDb()
  const since = new Date(Date.now() - 86400_000).toISOString()
  const [config, dau, { count: requests }, { count: rendered }, { count: noAd }, { data: credits }] = await Promise.all([
    loadCreatorRevenueConfig(), currentDau(),
    db.from('ad_revenue_events').select('ad_request_id', { count: 'exact', head: true }).gte('created_at', since),
    db.from('ad_revenue_events').select('ad_request_id', { count: 'exact', head: true }).gte('created_at', since).eq('fill_status', 'rendered'),
    db.from('ad_revenue_events').select('ad_request_id', { count: 'exact', head: true }).gte('created_at', since).eq('fill_status', 'no_ad'),
    db.from('creator_ad_balances').select('pending_amount, lifetime_amount')
  ])
  const sum = (k: 'pending_amount' | 'lifetime_amount') => (credits ?? []).reduce((s, c) => s + Number(c[k] || 0), 0)
  return {
    config, dau, networksActive: dau >= config.dau_gate,
    last24h: { requests: requests ?? 0, rendered: rendered ?? 0, noAd: noAd ?? 0, renderRate: requests ? Math.round(((rendered ?? 0) / requests) * 1000) / 10 : 0 },
    totals: { pending: sum('pending_amount'), lifetime: sum('lifetime_amount') }
  }
})
