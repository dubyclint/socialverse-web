import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getFeeSettings, payoutUsd } from '~/server/utils/wallet'

const GIFT_IN = new Set(['GIFT_RECOVERY_REDEEM', 'P2P_TIPPING_RECEIVED'])
const FEES = new Set(['DEPOSIT_FEE', 'GIFT_FEE'])

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()

  const [{ data: wallet }, { data: ledger }, fees] = await Promise.all([
    service.from('wallets').select('balance, withdrawable_balance, is_locked').eq('user_id', user.id).maybeSingle(),
    service.from('wallet_ledger').select('transaction_type, amount').eq('wallet_id', user.id).limit(10000),
    getFeeSettings()
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
  return {
    balance: Number(wallet?.balance ?? 0),
    withdrawable_pew: withdrawable,
    withdrawable_usd: payoutUsd(withdrawable, fees),
    is_locked: Boolean(wallet?.is_locked),
    totals,
    fees
  }
})
