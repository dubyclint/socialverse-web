import { getServiceClient } from '~/server/utils/supabase-admin'
import type { Json } from '~/types/database.types'

const asJson = (value: unknown) => value as Json
const mergeMetadata = (metadata: unknown, extra: Record<string, unknown>): Json =>
  ({ ...(metadata as Record<string, Json> | null), ...extra }) as Json

interface SettleInput {
  depositId: string
  externalRef?: string | null
  /** Amount the provider confirms it collected, in the deposit's source currency. */
  paidAmount?: number | null
  /** Currency of paidAmount when the provider charged in a converted currency. */
  paidCurrency?: string | null
  providerPayload: Record<string, unknown>
}

/**
 * Credits a deposit exactly once. `settle_deposit` is idempotent on the DB
 * side, so a replayed webhook cannot double-credit a wallet.
 */
export async function settleDeposit({ depositId, externalRef, paidAmount, paidCurrency, providerPayload }: SettleInput) {
  const service = getServiceClient()

  const { data: deposit, error } = await service
    .from('deposits')
    .select('id, status, gross_pewgift, source_amount, metadata')
    .eq('id', depositId)
    .maybeSingle()

  if (error) throw error
  if (!deposit) return { settled: false, reason: 'unknown_deposit' as const }
  if (deposit.status === 'SETTLED') return { settled: true, reason: 'already_settled' as const }

  const charged = deposit.metadata as { charge_currency?: string, charge_amount?: number } | null
  const expected = paidCurrency && charged?.charge_currency === paidCurrency.toUpperCase() && charged.charge_amount != null
    ? Number(charged.charge_amount)
    : Number(deposit.source_amount)

  // Under-payment is held for manual review rather than silently credited.
  if (paidAmount != null && Number(paidAmount) + 0.01 < expected) {
    await service
      .from('deposits')
      .update({
        status: 'PENDING',
        external_ref: externalRef ?? undefined,
        metadata: mergeMetadata(deposit.metadata, { provider_payload: asJson(providerPayload), underpaid: true })
      })
      .eq('id', depositId)
    return { settled: false, reason: 'underpaid' as const }
  }

  await service
    .from('deposits')
    .update({
      credited_pewgift: deposit.gross_pewgift,
      external_ref: externalRef ?? undefined,
      metadata: mergeMetadata(deposit.metadata, { provider_payload: asJson(providerPayload) })
    })
    .eq('id', depositId)

  const { error: settleError } = await service.rpc('settle_deposit', { p_deposit_id: depositId })
  if (settleError) throw settleError

  return { settled: true, reason: 'credited' as const }
}

export async function failDeposit(depositId: string, providerPayload: Record<string, unknown>) {
  const service = getServiceClient()
  const { data: deposit } = await service
    .from('deposits')
    .select('metadata, status')
    .eq('id', depositId)
    .maybeSingle()

  if (!deposit || deposit.status === 'SETTLED') return

  await service
    .from('deposits')
    .update({
      status: 'FAILED',
      metadata: mergeMetadata(deposit.metadata, { provider_payload: asJson(providerPayload) })
    })
    .eq('id', depositId)
}
