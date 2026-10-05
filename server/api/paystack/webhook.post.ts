import crypto from 'node:crypto'
import { createError, defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { failDeposit, settleDeposit } from '~/server/utils/payments/settle'
import { runtimeSecret } from '~/server/utils/runtime-secret'

interface PaystackEvent {
  event?: string
  data?: {
    reference?: string
    status?: string
    amount?: number
    currency?: string
  }
}

/** Paystack signs the raw body with HMAC-SHA512 using the secret key. */
export default defineEventHandler(async (event) => {
  const secret = runtimeSecret(useRuntimeConfig().paystackSecretKey, 'PAYSTACK_SECRET_KEY')
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Paystack not configured' })

  const signature = getHeader(event, 'x-paystack-signature')
  const raw = await readRawBody(event)
  if (!signature || !raw) throw createError({ statusCode: 400, statusMessage: 'Missing signature' })

  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  const matches =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  if (!matches) throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })

  const payload = JSON.parse(raw.toString()) as PaystackEvent
  const reference = payload.data?.reference

  if (reference) {
    if (payload.event === 'charge.success' && payload.data?.status === 'success') {
      await settleDeposit({
        depositId: reference,
        externalRef: reference,
        paidAmount: payload.data.amount != null ? Number(payload.data.amount) / 100 : null,
        paidCurrency: payload.data.currency ?? null,
        providerPayload: payload as unknown as Record<string, unknown>
      })
    } else if (payload.event === 'charge.failed') {
      await failDeposit(reference, payload as unknown as Record<string, unknown>)
    }
  }

  setResponseStatus(event, 200)
  return { received: true }
})
