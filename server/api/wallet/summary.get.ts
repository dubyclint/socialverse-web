import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getDirectPewWarning, getFeeSettings, payoutUsd } from '~/server/utils/wallet'

const GIFT_IN = new Set(['GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED'])
const FEES = new Set(['DEPOSIT_FEE', 'GIFT_FEE'])

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()

  const [{ data: wallet }, { data: ledger }, fees, { data: allowance }, warning] = await Promise.all([
    service.from('wallets').select('balance, withdrawable_balance, is_locked').eq('user_id', user.id).maybeSingle(),
    service.from('wallet_ledger').select('transaction_type, amount').eq('wallet_id', user.id).limit(10000),
    getFeeSettings(),
    service.rpc('direct_pew_allowance' as never, { p_user: user.id } as never),
    getDirectPewWarning()
  ])

  const totals = { added_funds: 0, gifts_received: 0, other_incoming: 0, outgoing: 0, fees: 0 }
  for (const row of ledger ?? []) {
    const amount = Number(row.amount)
    const type = String(row.transaction_type)
    if (FEES.has(type)) totals.fees += -amount
    else if (type === 'DEPOSIT') totals.added_funds += amount
    else if (GIFT_IN.has(type)) totals.gifts_received += amount
    else if (amount > 0) totals.other_incoming += amount
    else totals.outgoing += -amount
  }

  const withdrawable = Number(wallet?.withdrawable_balance ?? 0)
  // Deposited PEW that never went through gifting can still be withdrawn, after the gift and withdrawal fees, up to the period limit.
  const spare = Math.max(0, Number(wallet?.balance ?? 0) - withdrawable)
  const allowancePew = Math.max(0, Number(allowance ?? 0))
  const usable = Math.min(spare, allowancePew)
  const directUsd = Math.floor(usable * (1 - fees.gift_fee_pct / 100) * (1 - fees.withdrawal_fee_pct / 100) * fees.pew_usd_rate * 100) / 100
  return {
    direct: { spare_pew: spare, allowance_pew: allowancePew, limit_pew: fees.direct_pew_limit, window_days: fees.direct_pew_window_days, usd: directUsd, warning },
    balance: Number(wallet?.balance ?? 0),
    withdrawable_pew: withdrawable,
    withdrawable_usd: payoutUsd(withdrawable, fees),
    is_locked: Boolean(wallet?.is_locked),
    totals,
    fees
  }
})
