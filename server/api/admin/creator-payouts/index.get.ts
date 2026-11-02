import { getQuery } from 'h3'
import { requireStaff } from '~/server/utils/staff'
import { loadCreatorRevenueConfig, revenueDb } from '~/server/utils/creator-revenue'
import { generateDuePayouts, payoutTotal } from '~/server/utils/creator-payouts'

/** Admin: creator earnings statements per payout period. Due periods are statemented on each load. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'admin')
  const db = revenueDb()
  const cfg = await loadCreatorRevenueConfig()
  const q = getQuery(event)
  const generated = await generateDuePayouts(db, cfg, q.close === '1')
  const status = q.status === 'released' ? 'released' : 'pending'
  const { data: rows } = await db.from('creator_payouts').select('*').eq('status', status).order('created_at', { ascending: false }).limit(200)
  const ids = [...new Set((rows ?? []).flatMap(r => [r.creator_id, r.released_by].filter(Boolean)))]
  const { data: users } = ids.length ? await db.from('user').select('user_id, username, display_name').in('user_id', ids) : { data: [] }
  const byId = new Map(((users ?? []) as { user_id: string, username: string, display_name: string | null }[]).map(u => [u.user_id, u]))
  const { count: unpaid } = await db.from('ad_revenue_events').select('id', { count: 'exact', head: true }).eq('credited', true).is('payout_id', null)
  return {
    period_days: cfg.payout_period_days,
    payout_wallet: cfg.payout_wallet_username,
    generated,
    unstatemented_events: unpaid ?? 0,
    payouts: (rows ?? []).map(r => ({
      ...r,
      total: payoutTotal(r),
      username: byId.get(r.creator_id)?.username ?? '',
      name: byId.get(r.creator_id)?.display_name ?? '',
      released_by_username: r.released_by ? byId.get(r.released_by)?.username ?? '' : ''
    }))
  }
})
