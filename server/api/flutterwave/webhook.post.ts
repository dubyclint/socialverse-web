import crypto from 'node:crypto'
import { createError, defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { failDeposit, settleDeposit } from '~/server/utils/payments/settle'

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

/**
 * Flutterwave sends `flutterwave-signature`, which is either the dashboard
 * secret hash verbatim (legacy) or an HMAC-SHA256 of the raw body with it.
 */
export default defineEventHandler(async (event) => {
  const secretHash = useRuntimeConfig().flutterwaveWebhookHash
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
      await settleDeposit({
        depositId: reference,
        externalRef: payload.data.id != null ? String(payload.data.id) : reference,
        paidAmount: payload.data.amount != null ? Number(payload.data.amount) : null,
        providerPayload: payload as unknown as Record<string, unknown>
      })
    } else if (payload.data?.status === 'failed') {
      await failDeposit(reference, payload as unknown as Record<string, unknown>)
    }
  }

  setResponseStatus(event, 200)
  return { received: true }
})
