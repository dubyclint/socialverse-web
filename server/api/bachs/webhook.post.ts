import crypto from 'node:crypto'
import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { runtimeSecret } from '~/server/utils/runtime-secret'
import { reconcileBachsCheckout } from '~/server/utils/payments/reconcile'

interface BachsEvent {
  id?: string
  type?: string
  data?: { checkout_id?: string, metadata?: Record<string, string> | null }
}

const TOLERANCE_SECONDS = 300

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a, 'hex')
  const right = Buffer.from(b, 'hex')
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right)
}

/**
 * Bachs signs `"{timestamp}.{raw_body}"` with the endpoint's signing secret
 * (HMAC-SHA256 hex) in `X-Bachs-Signature`, and repeats it as
 * `t=…,v1=…[,v1=…]` in `X-Bachs-Signature-V2` while a secret is rotating.
 */
const verify = (raw: string, secret: string, timestamp: string | undefined, v1: string | undefined, v2: string | undefined) => {
  let ts = timestamp
  const candidates: string[] = []
  if (v2) {
    for (const part of v2.split(',')) {
      const [k, v] = part.trim().split('=')
      if (k === 't' && v) ts = v
      if (k === 'v1' && v) candidates.push(v)
    }
  }
  if (v1) candidates.push(v1)
  if (!ts || !candidates.length) return false
  if (Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCE_SECONDS) return false
  const expected = crypto.createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex')
  return candidates.some(c => safeEqual(c, expected))
}

export default defineEventHandler(async (event) => {
  const secret = runtimeSecret(useRuntimeConfig().bachsWebhookSecret, 'BACHS_WEBHOOK_SECRET')
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Bachs webhook not configured' })

  const raw = await readRawBody(event, 'utf8')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  const ok = verify(
    raw,
    secret,
    getHeader(event, 'x-bachs-timestamp'),
    getHeader(event, 'x-bachs-signature'),
    getHeader(event, 'x-bachs-signature-v2')
  )
  if (!ok) throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })

  const payload = JSON.parse(raw) as BachsEvent
  const checkoutId = payload.data?.checkout_id
  if (checkoutId && ['checkout.completed', 'collection.succeeded', 'checkout.expired', 'collection.failed'].includes(payload.type ?? '')) {
    // Amount and status always come from a fresh read of the checkout, never the webhook body.
    await reconcileBachsCheckout(checkoutId, payload as unknown as Record<string, unknown>, payload.type === 'checkout.expired')
  }
  return { received: true }
})
