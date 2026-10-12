import { getRouterParam } from 'h3'
import { requirePageRole } from '~/server/utils/actor'
import { loadPage } from '~/server/utils/pages'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getFeeSettings, LEDGER_LABELS, payoutUsd } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  const page = await loadPage(String(getRouterParam(event, 'id')))
  const { role } = await requirePageRole(event, page.id, ['OWNER', 'MANAGER'])
  const service = getServiceClient()

  const [{ data: wallet }, { data: ledger }, fees] = await Promise.all([
    service.from('page_wallets').select('balance, withdrawable_balance, is_locked').eq('page_id', page.id).maybeSingle(),
    service.from('page_wallet_ledger')
      .select('id, amount, transaction_type, counterpart_id, counterpart_type, operator_id, created_at')
      .eq('page_id', page.id)
      .order('created_at', { ascending: false })
      .limit(100),
    getFeeSettings()
  ])

  const userIds = [...new Set((ledger ?? []).flatMap(r => [r.counterpart_type === 'USER' ? r.counterpart_id : null, r.operator_id]).filter((id): id is string => !!id))]
  const pageIds = [...new Set((ledger ?? []).filter(r => r.counterpart_type === 'PAGE' && r.counterpart_id).map(r => r.counterpart_id as string))]
  const [{ data: users }, { data: pages }] = await Promise.all([
    userIds.length ? service.from('user').select('user_id, username').in('user_id', userIds) : Promise.resolve({ data: [] as { user_id: string, username: string | null }[] }),
    pageIds.length ? service.from('pages').select('id, handle').in('id', pageIds) : Promise.resolve({ data: [] as { id: string, handle: string }[] })
  ])
  const names = new Map<string, string>([
    ...(users ?? []).map(u => [u.user_id, `@${u.username ?? 'user'}`] as [string, string]),
    ...(pages ?? []).map(p => [p.id, `@${p.handle}`] as [string, string])
  ])

  const withdrawable = Number(wallet?.withdrawable_balance ?? 0)
  return {
    role,
    balance: Number(wallet?.balance ?? 0),
    withdrawable_pew: withdrawable,
    withdrawable_usd: payoutUsd(withdrawable, fees),
    is_locked: wallet?.is_locked ?? false,
    gift_fee_pct: fees.gift_fee_pct,
    items: (ledger ?? []).map((r) => {
      const type = String(r.transaction_type)
      const amount = Number(r.amount)
      const label = type === 'PAGE_TRANSFER_IN'
        ? 'Funds added by admin'
        : type === 'PAGE_PAYOUT' ? 'Earnings paid to owner' : LEDGER_LABELS[type]?.label ?? type
      return {
        id: r.id,
        label,
        direction: amount >= 0 ? 'in' : 'out',
        amount: Math.abs(amount),
        counterpart: r.counterpart_id ? names.get(r.counterpart_id) ?? null : null,
        operator: r.operator_id ? names.get(r.operator_id) ?? null : null,
        created_at: r.created_at
      }
    })
  }
})
