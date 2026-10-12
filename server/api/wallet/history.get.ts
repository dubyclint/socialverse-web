import { getQuery } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DEPOSIT_STATE, LEDGER_LABELS, type TxDirection, type TxState } from '~/server/utils/wallet'

interface HistoryItem {
  id: string
  label: string
  kind: string
  direction: TxDirection
  amount: number
  state: TxState
  counterpart: string | null
  detail: string | null
  created_at: string
}

/**
 * Incoming/outgoing history from the ledger, plus deposits that have not
 * settled yet (they have no ledger row). `filter=gifts` keeps gift rows only.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const giftsOnly = query.filter === 'gifts'
  const limit = Math.min(Number(query.limit) || 100, 300)
  const service = getServiceClient()

  const [{ data: ledger }, { data: deposits }, { data: withdrawals }] = await Promise.all([
    service.from('wallet_ledger')
      .select('id, amount, transaction_type, counterpart_id, reference_id, metadata, created_at')
      .eq('wallet_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit),
    giftsOnly
      ? Promise.resolve({ data: [] })
      : service.from('deposits')
        .select('id, provider_code, source_amount, source_currency, gross_pewgift, status, created_at')
        .eq('user_id', user.id)
        .neq('status', 'SETTLED')
        .order('created_at', { ascending: false })
        .limit(50),
    service.from('withdrawals').select('id, status, method, payout_usd').eq('user_id', user.id)
  ])

  const withdrawalById = new Map((withdrawals ?? []).map(w => [w.id, w]))
  const counterpartIds = [...new Set((ledger ?? []).map(r => r.counterpart_id).filter((id): id is string => !!id))]
  const { data: people } = counterpartIds.length
    ? await service.from('user').select('user_id, username').in('user_id', counterpartIds)
    : { data: [] }
  const usernames = new Map((people ?? []).map(p => [p.user_id, p.username]))

  const items: HistoryItem[] = []
  for (const row of ledger ?? []) {
    const type = String(row.transaction_type)
    const meta = LEDGER_LABELS[type] ?? { label: type.replace(/_/g, ' ').toLowerCase(), kind: 'trade' }
    if (giftsOnly && meta.kind !== 'gift') continue
    const amount = Number(row.amount)
    let state: TxState = 'successful'
    let detail: string | null = null
    if (type === 'WITHDRAWAL' && row.reference_id) {
      const w = withdrawalById.get(row.reference_id)
      state = (w?.status as TxState) ?? 'pending'
      detail = w ? `${w.method === 'crypto' ? 'Crypto' : 'Bank'} · $${Number(w.payout_usd ?? 0).toFixed(2)} payout` : null
    }
    items.push({
      id: row.id,
      label: meta.label,
      kind: meta.kind,
      direction: amount >= 0 ? 'in' : 'out',
      amount: Math.abs(amount),
      state,
      counterpart: row.counterpart_id ? usernames.get(row.counterpart_id) ?? null : null,
      detail,
      created_at: row.created_at
    })
  }

  for (const d of deposits ?? []) {
    items.push({
      id: d.id,
      label: 'Add funds',
      kind: 'deposit',
      direction: 'in',
      amount: Number(d.gross_pewgift),
      state: DEPOSIT_STATE[d.status] ?? 'pending',
      counterpart: null,
      detail: `${d.provider_code ?? 'Payment'} · ${Number(d.source_amount).toFixed(2)} ${d.source_currency}`,
      created_at: d.created_at
    })
  }

  items.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return { items: items.slice(0, limit) }
})
