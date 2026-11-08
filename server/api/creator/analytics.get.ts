import { getQuery } from 'h3'
import { requireStaff } from '~/server/utils/staff'
import { requireUser } from '~/server/utils/auth'
import { isMonetized } from '~/server/utils/monetization'
import { loadCreatorRevenueConfig, revenueDb } from '~/server/utils/creator-revenue'

/** Creator Studio data (own data for monetized creators; any creator for staff): plays, ad-interacted engaged views, ledger, drop-off curve. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const q = getQuery(event)
  const pageId = String(q.pageId ?? '')
  const creatorId = String(q.userId ?? '')
  if (!creatorId && !pageId) throw createError({ statusCode: 400, statusMessage: 'userId or pageId required' })
  const db = revenueDb()
  if (pageId) {
    const { data: role } = await db.from('page_admins').select('role').eq('page_id', pageId).eq('user_id', user.id).maybeSingle()
    if (!role) await requireStaff(event)
  } else if (!(creatorId === user.id && await isMonetized(user.id))) await requireStaff(event)
  const cfg = await loadCreatorRevenueConfig()
  const gate = cfg.engaged_seconds
  const { data: posts } = await db.from('posts').select('id, views_count, content, media_urls, created_at').eq(pageId ? 'page_id' : 'user_id', pageId || creatorId).or(pageId ? `page_id.eq.${pageId}` : 'page_id.is.null').order('created_at', { ascending: false }).limit(200)
  const ids = (posts ?? []).map(p => p.id)
  // Page studios cover the Page's own posts; personal studios cover the creator's earnings.
  const scopeIds = ids.length ? ids : ['00000000-0000-0000-0000-000000000000']
  const ledgerQ = db.from('ad_revenue_events').select('ad_request_id, post_id, ad_type_served, network_source, current_network_ecpm, wallet_credit_amount, fund_credit_amount, settled_at')
  const viewsQ = db.from('ad_revenue_events').select('ad_request_id', { count: 'exact', head: true })
  const [{ data: ledger }, { data: watches }, { data: balance }] = await Promise.all([
    (pageId ? ledgerQ.in('post_id', scopeIds) : ledgerQ.eq('creator_id', creatorId)).eq('credited', true).order('settled_at', { ascending: false }).limit(100),
    ids.length ? db.from('veep_events').select('post_id, watch_ms').in('post_id', ids).limit(20000) : Promise.resolve({ data: [] }),
    pageId ? Promise.resolve({ data: null }) : db.from('creator_ad_balances').select('pending_amount, lifetime_amount').eq('creator_id', creatorId).maybeSingle()
  ])
  const { count: adViews } = await (pageId ? viewsQ.in('post_id', scopeIds) : viewsQ.eq('creator_id', creatorId)).eq('is_engaged_view', true).eq('ad_interacted', true)
  // Drop-off: share of plays still watching at each second (0..60s), marking the 6s ad window.
  const secs = ((watches ?? []) as { watch_ms: number }[]).map(w => w.watch_ms / 1000)
  const curve = Array.from({ length: 31 }, (_, i) => i * 2).map(t => ({ t, pct: secs.length ? Math.round((secs.filter(s => s >= t).length / secs.length) * 1000) / 10 : 0 }))
  const plays = (posts ?? []).reduce((s, p) => s + Number((p as { views_count?: number }).views_count ?? 0), 0)
  return { engagedSeconds: gate, plays, adInteractedEngagedViews: adViews ?? 0, reachAdWindowPct: secs.length ? Math.round((secs.filter(s => s >= gate).length / secs.length) * 1000) / 10 : 0, curve, ledger: ledger ?? [], balance: balance ?? { pending_amount: 0, lifetime_amount: 0 } }
})
