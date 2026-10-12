import { createError, type H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

export interface FeeSettings {
  deposit_fee_pct: number
  gift_fee_pct: number
  withdrawal_fee_pct: number
  withdrawal_tax_pct: number
  pew_usd_rate: number
  min_withdrawal_pew: number
}

export const DEFAULT_FEES: FeeSettings = {
  deposit_fee_pct: 1.2,
  gift_fee_pct: 5,
  withdrawal_fee_pct: 37,
  withdrawal_tax_pct: 0,
  pew_usd_rate: 1,
  min_withdrawal_pew: 10
}

export const getFeeSettings = async (): Promise<FeeSettings> => {
  const { data } = await getServiceClient()
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', 'fee_settings')
    .maybeSingle()
  const stored = (data?.config_values ?? {}) as Partial<Record<keyof FeeSettings, number | string>>
  const merged = { ...DEFAULT_FEES }
  for (const key of Object.keys(DEFAULT_FEES) as (keyof FeeSettings)[]) {
    const value = Number(stored[key])
    if (Number.isFinite(value)) merged[key] = value
  }
  return merged
}

/** USD paid out for `pew` earned PEW after the withdrawal fee and tax. */
export const payoutUsd = (pew: number, fees: FeeSettings) =>
  Number((pew * (1 - (fees.withdrawal_fee_pct + fees.withdrawal_tax_pct) / 100) * fees.pew_usd_rate).toFixed(2))

export const requireWalletAdmin = async (event: H3Event) => {
  const user = await requireUser(event)
  const { data } = await getServiceClient().from('user').select('role').eq('user_id', user.id).maybeSingle()
  if (!data || !['admin', 'manager'].includes(String(data.role))) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  return user
}

export type TxState = 'successful' | 'pending' | 'processing' | 'failed'
export type TxDirection = 'in' | 'out'

export const LEDGER_LABELS: Record<string, { label: string, kind: 'deposit' | 'gift' | 'trade' | 'fee' | 'withdrawal' | 'earning' }> = {
  DEPOSIT: { label: 'Add funds', kind: 'deposit' },
  DEPOSIT_FEE: { label: 'App processing fee', kind: 'fee' },
  GIFT_PURCHASE: { label: 'Gift sent', kind: 'gift' },
  P2P_TIPPING_SENT: { label: 'Gift sent', kind: 'gift' },
  GIFT_RECOVERY_REDEEM: { label: 'Gift received', kind: 'gift' },
  P2P_TIPPING_RECEIVED: { label: 'Gift received', kind: 'gift' },
  GIFT_FEE: { label: 'Gift fee', kind: 'fee' },
  ESCROW_COLLATERAL_LOCK: { label: 'P2P sell (held in escrow)', kind: 'trade' },
  ESCROW_MILESTONE_RELEASE: { label: 'Escrow received', kind: 'trade' },
  ESCROW_DISPUTE_REFUND: { label: 'Escrow refund', kind: 'trade' },
  AD_ENGAGEMENT_REVENUE: { label: 'Monetization', kind: 'earning' },
  WITHDRAWAL: { label: 'Withdrawal', kind: 'withdrawal' },
  WITHDRAWAL_REFUND: { label: 'Withdrawal returned', kind: 'withdrawal' }
}

export const DEPOSIT_STATE: Record<string, TxState> = {
  AWAITING_PAYMENT: 'pending',
  PENDING: 'processing',
  SETTLED: 'successful',
  FAILED: 'failed',
  REFUNDED: 'failed'
}
