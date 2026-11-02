import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreatorRevenueConfig } from '~/server/utils/creator-revenue'

interface UnpaidEvent {
  id: string
  creator_id: string
  network_source: string
  ad_type_served: string
  wallet_credit_amount: number
  fund_credit_amount: number
  settled_at: string
}

const r8 = (n: number) => Math.round(n * 1e8) / 1e8

/**
 * Groups credited, not-yet-statemented ad revenue events into one pending payout per creator once the
 * creator's oldest unpaid credit is at least payout_period_days old (or immediately when force=true).
 */
export const generateDuePayouts = async (db: SupabaseClient, cfg: CreatorRevenueConfig, force = false) => {
  const { data } = await db.from('ad_revenue_events')
    .select('id, creator_id, network_source, ad_type_served, wallet_credit_amount, fund_credit_amount, settled_at')
    .eq('credited', true).is('payout_id', null).not('settled_at', 'is', null)
    .order('settled_at', { ascending: true }).limit(20000)
  const byCreator = new Map<string, UnpaidEvent[]>()
  for (const e of (data ?? []) as UnpaidEvent[]) byCreator.set(e.creator_id, [...(byCreator.get(e.creator_id) ?? []), e])
  const cutoff = Date.now() - cfg.payout_period_days * 86400_000
  let created = 0
  for (const [creatorId, events] of byCreator) {
    if (!force && new Date(events[0]!.settled_at).getTime() > cutoff) continue
    let external = 0, internal = 0, fund = 0
    const byType: Record<string, { count: number, amount: number }> = {}
    const bySource: Record<string, { count: number, amount: number }> = {}
    for (const e of events) {
      const ad = Number(e.wallet_credit_amount) || 0
      const f = Number(e.fund_credit_amount) || 0
      if (e.network_source === 'internal_house') internal += ad
      else external += ad
      fund += f
      const t = (byType[e.ad_type_served] ??= { count: 0, amount: 0 }); t.count++; t.amount = r8(t.amount + ad)
      const s = (bySource[e.network_source] ??= { count: 0, amount: 0 }); s.count++; s.amount = r8(s.amount + ad)
    }
    const { data: payout, error } = await db.from('creator_payouts').insert({
      creator_id: creatorId,
      period_start: events[0]!.settled_at,
      period_end: new Date().toISOString(),
      external_amount: r8(external), internal_amount: r8(internal), fund_amount: r8(fund),
      breakdown: { by_type: byType, by_source: bySource, fund_views: events.filter(e => Number(e.fund_credit_amount) > 0).length },
      events_count: events.length
    }).select('id').single()
    if (error || !payout) continue
    const ids = events.map(e => e.id)
    for (let i = 0; i < ids.length; i += 500) await db.from('ad_revenue_events').update({ payout_id: payout.id }).in('id', ids.slice(i, i + 500))
    created++
  }
  return created
}

export const payoutBase = (p: { external_amount: number, internal_amount: number, fund_amount: number }) =>
  r8((Number(p.external_amount) || 0) + (Number(p.internal_amount) || 0) + (Number(p.fund_amount) || 0))
export const payoutTotal = (p: { external_amount: number, internal_amount: number, fund_amount: number, adjustment: number }) =>
  r8(payoutBase(p) + (Number(p.adjustment) || 0))
