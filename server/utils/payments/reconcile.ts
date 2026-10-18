import { useRuntimeConfig } from '#imports'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { runtimeSecret } from '~/server/utils/runtime-secret'
import { bachsRequest, isBachsPaid, type BachsCheckout } from './bachs'
import { failDeposit, settleDeposit } from './settle'

/** Settles (or fails) the deposit behind a Bachs checkout from Bachs's own record. */
export async function reconcileBachsCheckout(checkoutId: string, payload: Record<string, unknown> | null = null, expired = false) {
  const checkout = await bachsRequest<BachsCheckout>(`/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`)
  let depositId = checkout.metadata?.deposit_id ?? null
  if (!depositId) {
    const { data } = await getServiceClient()
      .from('deposits')
      .select('id')
      .eq('provider_code', 'bachs')
      .eq('external_ref', checkoutId)
      .maybeSingle()
    depositId = data?.id ?? null
  }
  if (!depositId) return { settled: false, reason: 'unknown_deposit' as const }

  const providerPayload = { checkout: checkout as unknown as Record<string, unknown>, event: payload }
  if (isBachsPaid(checkout)) {
    return settleDeposit({
      depositId,
      externalRef: checkoutId,
      paidAmount: Number(checkout.charge?.amount ?? checkout.amount),
      paidCurrency: checkout.charge?.currency ?? checkout.currency ?? null,
      providerPayload
    })
  }
  if (expired || checkout.status === 'expired') {
    await failDeposit(depositId, providerPayload)
    return { settled: false, reason: 'expired' as const }
  }
  return { settled: false, reason: 'pending' as const }
}

interface FlutterwaveTx { id: number | string, tx_ref: string, status: string, amount: number, currency: string }

/** Looks the deposit up on Flutterwave by our tx_ref and settles it if paid. */
export async function reconcileFlutterwave(depositId: string) {
  const secret = runtimeSecret(useRuntimeConfig().flutterwaveSecretKey, 'FLUTTERWAVE_SECRET_KEY')
  if (!secret) return { settled: false, reason: 'not_configured' as const }
  try {
    const res = await $fetch<{ status: string, data?: FlutterwaveTx }>(
      'https://api.flutterwave.com/v3/transactions/verify_by_reference',
      { query: { tx_ref: depositId }, headers: { authorization: `Bearer ${secret}` }, timeout: 15000 }
    )
    const tx = res.data
    if (!tx || tx.tx_ref !== depositId) return { settled: false, reason: 'pending' as const }
    if (tx.status === 'successful') {
      return settleDeposit({
        depositId,
        externalRef: String(tx.id),
        paidAmount: Number(tx.amount),
        paidCurrency: tx.currency,
        providerPayload: res as unknown as Record<string, unknown>
      })
    }
    if (tx.status === 'failed') await failDeposit(depositId, res as unknown as Record<string, unknown>)
    return { settled: false, reason: 'pending' as const }
  } catch {
    return { settled: false, reason: 'pending' as const }
  }
}
