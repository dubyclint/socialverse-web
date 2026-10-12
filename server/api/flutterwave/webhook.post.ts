import crypto from 'node:crypto'
import { createError, defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { failDeposit, settleDeposit } from '~/server/utils/payments/settle'
import { runtimeSecret } from '~/server/utils/runtime-secret'

interface FlutterwaveEvent {
  event?: string
  data?: {
    tx_ref?: string
    id?: number | string
    status?: string
    amount?: number
    currency?: string
  }
}

interface VerifiedTransaction {
  id: number | string
  tx_ref: string
  status: string
  amount: number
  currency: string
}

/**
 * Re-reads the transaction from Flutterwave so the amount and status come from
 * the provider, not the webhook body. Returns null unless it is successful and
 * belongs to this deposit.
 */
const verifyTransaction = async (id: number | string | undefined, reference: string): Promise<VerifiedTransaction | null> => {
  const secret = runtimeSecret(useRuntimeConfig().flutterwaveSecretKey, 'FLUTTERWAVE_SECRET_KEY')
  if (!secret || id == null) return null
  try {
    const res = await $fetch<{ status: string, data?: VerifiedTransaction }>(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(id))}/verify`,
      { headers: { authorization: `Bearer ${secret}` }, timeout: 15000 }
    )
    const tx = res.data
    return tx && tx.status === 'successful' && tx.tx_ref === reference ? tx : null
  } catch (err) {
    console.error('[flutterwave] verify failed:', err)
    return null
  }
}

/**
 * Flutterwave sends `flutterwave-signature`, which is either the dashboard
 * secret hash verbatim (legacy) or an HMAC-SHA256 of the raw body with it.
 */
export default defineEventHandler(async (event) => {
  const secretHash = runtimeSecret(useRuntimeConfig().flutterwaveWebhookHash, 'FLUTTERWAVE_WEBHOOK_HASH')
  if (!secretHash) throw createError({ statusCode: 503, statusMessage: 'Flutterwave not configured' })

  const signature = getHeader(event, 'flutterwave-signature') || getHeader(event, 'verif-hash')
  const raw = await readRawBody(event)
  if (!signature || !raw) throw createError({ statusCode: 400, statusMessage: 'Missing signature' })

  const hashed = crypto.createHmac('sha256', secretHash).update(raw).digest('hex')
  if (signature !== secretHash && signature !== hashed) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const payload = JSON.parse(raw.toString()) as FlutterwaveEvent
  const reference = payload.data?.tx_ref

  if (reference) {
    if (payload.data?.status === 'successful') {
      const verified = await verifyTransaction(payload.data.id, reference)
      if (verified) {
        await settleDeposit({
          depositId: reference,
          externalRef: String(verified.id),
          paidAmount: Number(verified.amount),
          paidCurrency: verified.currency,
          providerPayload: payload as unknown as Record<string, unknown>
        })
      }
    } else if (payload.data?.status === 'failed') {
      await failDeposit(reference, payload as unknown as Record<string, unknown>)
    }
  }

  setResponseStatus(event, 200)
  return { received: true }
})
