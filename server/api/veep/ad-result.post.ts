import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { loadCreatorRevenueConfig, revenueDb, viewCredit, type AdType } from '~/server/utils/creator-revenue'
import { isMonetized } from '~/server/utils/monetization'

/**
 * Settles one ad request. The creator is credited ONLY when the row is an engaged view
 * (is_engaged_view, set server-side at >= engaged_seconds) AND the ad reported 'rendered'
 * (ad_interacted). Three sources, all admin-set: external ads (Monetag/Appodeal: eCPM x creator_share_pct),
 * internal ads (house eCPM x internal_share_pct) and the platform fund (PEW per 1,000 engaged views, default 0).
 * Timeouts/no-fill settle as 'no_ad' with zero credit. Each request settles once.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ adRequestId?: string, status?: 'rendered' | 'no_ad' | 'rendered_failed', adType?: AdType }>(event)
  if (!body?.adRequestId) throw createError({ statusCode: 400, statusMessage: 'adRequestId required' })
  const db = revenueDb()
  const { data: row } = await db.from('ad_revenue_events').select('*').eq('ad_request_id', body.adRequestId).eq('viewer_id', user.id).is('settled_at', null).maybeSingle()
  if (!row) return { ok: false }
  const rendered = body.status === 'rendered'
  const cfg = await loadCreatorRevenueConfig()
  const adType = (row.network_source === 'internal_house' ? 'house_ad' : (body.adType ?? row.ad_type_served)) as AdType
  const ecpm = cfg.ecpm[adType] ?? 0
  // Only monetized creators (met the requirements or admin-awarded) earn; others are logged at zero.
  const monetized = row.is_engaged_view ? await isMonetized(row.creator_id) : false
  const share = row.network_source === 'internal_house' ? cfg.internal_share_pct : cfg.creator_share_pct
  const { raw, credit: adCredit } = rendered && monetized ? viewCredit(ecpm, share) : { raw: 0, credit: 0 }
  const fund = monetized ? viewCredit(Math.max(0, Number(cfg.platform_fund_cpm) || 0), 100).credit : 0
  const credit = Math.round((adCredit + fund) * 1e8) / 1e8
  const { data: settled } = await db.from('ad_revenue_events').update({
    fill_status: rendered ? 'rendered' : body.status === 'rendered_failed' ? 'rendered_failed' : 'no_ad',
    ad_interacted: rendered, ad_type_served: rendered ? adType : 'none', current_network_ecpm: ecpm,
    raw_ad_revenue: raw, wallet_credit_amount: adCredit, fund_credit_amount: fund, credited: credit > 0, settled_at: new Date().toISOString()
  }).eq('ad_request_id', row.ad_request_id).is('settled_at', null).select('ad_request_id').maybeSingle()
  if (settled && credit > 0) {
    const { data: bal } = await db.from('creator_ad_balances').select('pending_amount, lifetime_amount').eq('creator_id', row.creator_id).maybeSingle()
    await db.from('creator_ad_balances').upsert({
      creator_id: row.creator_id,
      pending_amount: Number(bal?.pending_amount ?? 0) + credit,
      lifetime_amount: Number(bal?.lifetime_amount ?? 0) + credit,
      updated_at: new Date().toISOString()
    })
  }
  return { ok: true, credit }
})
