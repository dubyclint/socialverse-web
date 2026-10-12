import { createError } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

type LedgerType = 'GIFT_PURCHASE' | 'GIFT_RECOVERY_REDEEM' | 'PAGE_TRANSFER_OUT' | 'PAGE_TRANSFER_IN' | 'PAGE_PAYOUT'

export interface PageTransfer {
  fromType: 'USER' | 'PAGE'
  fromId: string
  toType: 'USER' | 'PAGE'
  toId: string
  amount: number
  debit: LedgerType
  credit: LedgerType
  operatorId: string
  referenceId?: string | null
  metadata?: Record<string, unknown>
}

const FRIENDLY: [RegExp, string][] = [
  [/insufficient withdrawable/i, 'Not enough withdrawable PEW'],
  [/insufficient balance/i, 'Not enough PEW in this wallet'],
  [/locked/i, 'This wallet is locked'],
  [/positive/i, 'Enter an amount greater than zero'],
  [/invalid transfer parties/i, 'Invalid transfer']
]

/** Runs page_wallet_transfer and returns the sender's new balance. */
export const pageWalletTransfer = async (t: PageTransfer): Promise<number> => {
  const { data, error } = await getServiceClient().rpc('page_wallet_transfer', {
    p_from_type: t.fromType,
    p_from_id: t.fromId,
    p_to_type: t.toType,
    p_to_id: t.toId,
    p_amount: t.amount,
    p_debit_type: t.debit,
    p_credit_type: t.credit,
    p_operator: t.operatorId,
    p_reference_id: t.referenceId ?? undefined,
    p_metadata: (t.metadata ?? {}) as never
  })
  if (error) {
    const friendly = FRIENDLY.find(([re]) => re.test(error.message))?.[1]
    throw createError({ statusCode: 400, statusMessage: friendly ?? error.message })
  }
  return Number(data)
}

export const parseAmount = (raw: unknown): number => {
  const amount = Math.round(Number(raw) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Enter an amount greater than zero' })
  }
  return amount
}
