import crypto from 'node:crypto'
import { createError, defineEventHandler, getHeader, readRawBody, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { failDeposit, settleDeposit } from '~/server/utils/payments/settle'

interface NowPaymentsIpn {
  payment_id?: number | string
  payment_status?: string
  order_id?: string
  price_amount?: number
  actually_paid?: number
  pay_currency?: string
}

const SETTLED = new Set(['finished', 'confirmed', 'sending'])
const FAILED = new Set(['failed', 'refunded', 'expired'])

/**
 * NOWPayments IPN. The signature is HMAC-SHA512 of the payload serialised with
 * its keys sorted, so the raw body has to be re-stringified the same way.
 */
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig().nowpaymentsIpnSecret
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'IPN secret not configured' })

  const signature = getHeader(event, 'x-nowpayments-sig')
  const raw = await readRawBody(event)
  if (!signature || !raw) throw createError({ statusCode: 400, statusMessage: 'Missing signature' })

  let payload: NowPaymentsIpn & Record<string, unknown>
  try {
    payload = JSON.parse(raw.toString())
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const expected = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload, Object.keys(payload).sort()))
    .digest('hex')

  const matches =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))

  if (!matches) throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })

  const depositId = payload.order_id
  const status = String(payload.payment_status ?? '').toLowerCase()

  if (!depositId) {
    setResponseStatus(event, 200)
    return { received: true }
  }

  if (SETTLED.has(status)) {
    await settleDeposit({
      depositId,
      externalRef: payload.payment_id != null ? String(payload.payment_id) : null,
      paidAmount: payload.price_amount != null ? Number(payload.price_amount) : null,
      providerPayload: payload
    })
  } else if (FAILED.has(status)) {
    await failDeposit(depositId, payload)
  }

  setResponseStatus(event, 200)
  return { received: true }
})
