import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { refreshFiatRatesIfStale } from '~/server/utils/fx-rates'

/**
 * Sellers matching a currency + PEW amount. side=sell → deposit offers (seller sells PEW),
 * side=buy → withdrawal offers (seller buys PEW and pays the user). 1 PEW = 1 USD.
 * Payment account details are only revealed by /api/p2p/listings/[id]/details.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const q = getQuery(event) as { asset?: string, amount?: string, side?: string }
  const side = q.side === 'buy' ? 'buy' : 'sell'
  const amount = Number(q.amount)
  const asset = String(q.asset || '').toUpperCase()
  if (!asset || !Number.isFinite(amount) || amount <= 0) throw createError({ statusCode: 400, statusMessage: 'Currency and a positive amount are required' })

  const db = getServiceClient()
  await refreshFiatRatesIfStale(db)
  const [{ data: a }, { data: fee }, { data: wfee }] = await Promise.all([
    db.from('supported_assets').select('reference_rate, is_enabled').eq('code', asset).maybeSingle(),
    db.from('fee_settings').select('percent_rate').eq('scope', 'deposit').eq('is_active', true),
    db.rpc('fee_setting' as never, { p_key: 'withdrawal_fee_pct', p_default: 37 } as never)
  ])
  if (!a?.is_enabled) throw createError({ statusCode: 400, statusMessage: 'Currency is not available' })
  const rate = Number(a.reference_rate)
  const depositPct = Math.max(0, ...((fee ?? []).map(f => Number(f.percent_rate) || 0)))
  const withdrawPct = Number(wfee ?? 37)

  const { data: listings } = await db.from('p2p_listings')
    .select('id, seller_id, asset_code, margin_pct, min_amount, max_amount, available_pewgift, terms, payment_method_id, updated_at')
    .eq('is_active', true).eq('side' as never, side as never).eq('asset_code', asset)
    .lte('min_amount', amount).gte('max_amount', amount).gte('available_pewgift', amount)
    .neq('seller_id', user.id).limit(100)
  const rows = listings ?? []
  const sellerIds = [...new Set(rows.map(l => l.seller_id))]
  const methodIds = rows.map(l => l.payment_method_id).filter(Boolean) as string[]
  const [{ data: profiles }, { data: users }, { data: methods }, { data: balances }] = await Promise.all([
    db.from('seller_profiles').select('user_id, is_active, revoked_at, display_name, buyer_notes').in('user_id', sellerIds.length ? sellerIds : ['00000000-0000-0000-0000-000000000000']),
    db.from('user').select('user_id, username, display_name, avatar_url, is_verified, verified_type, is_banned').in('user_id', sellerIds.length ? sellerIds : ['00000000-0000-0000-0000-000000000000']),
    db.from('seller_payment_methods').select('id, kind, bank_name, network, status').in('id', methodIds.length ? methodIds : ['00000000-0000-0000-0000-000000000000']),
    db.from('wallets').select('user_id, balance').in('user_id', sellerIds.length ? sellerIds : ['00000000-0000-0000-0000-000000000000'])
  ])
  const prof = new Map((profiles ?? []).map(p => [p.user_id, p as typeof p & { display_name?: string | null, buyer_notes?: string | null }]))
  const usr = new Map((users ?? []).map(u => [u.user_id, u]))
  const meth = new Map((methods ?? []).map(m => [m.id, m]))
  const bal = new Map((balances ?? []).map(b => [b.user_id, Number(b.balance)]))

  const matches = rows.flatMap((l) => {
    const p = prof.get(l.seller_id); const u = usr.get(l.seller_id); const m = l.payment_method_id ? meth.get(l.payment_method_id) : null
    if (!p || !p.is_active || p.revoked_at || !u || u.is_banned || !m || m.status !== 'APPROVED') return []
    if (side === 'sell' && (bal.get(l.seller_id) ?? 0) < amount) return []
    const margin = Number(l.margin_pct)
    const net = side === 'sell' ? amount : amount * (1 - withdrawPct / 100)
    const perPew = side === 'sell' ? (1 + (margin + depositPct) / 100) / rate : (1 - margin / 100) / rate
    return [{
      listing_id: l.id, seller_id: l.seller_id, side,
      seller_name: p.display_name || u.display_name || u.username, username: u.username, avatar_url: u.avatar_url,
      is_verified: u.is_verified, verified_type: u.verified_type,
      buyer_notes: p.buyer_notes, terms: l.terms, method_kind: m.kind, method_label: m.bank_name || m.network || m.kind,
      margin_pct: margin, platform_fee_pct: side === 'sell' ? depositPct : withdrawPct,
      min_amount: Number(l.min_amount), max_amount: Math.min(Number(l.max_amount), Number(l.available_pewgift)),
      price_per_pew: Number(perPew.toFixed(6)), pew_after_fee: Number(net.toFixed(4)),
      quote_amount: Number((net * (side === 'sell' ? (1 + (margin + depositPct) / 100) : (1 - margin / 100)) / rate).toFixed(2))
    }]
  })
  matches.sort((x, y) => side === 'sell' ? x.price_per_pew - y.price_per_pew : y.price_per_pew - x.price_per_pew)
  return { asset, amount, side, usd_per_unit: rate, units_per_pew: Number((1 / rate).toFixed(6)), matches }
})
