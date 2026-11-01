import { applyDiditDecision } from '~/server/utils/didit'
import crypto from 'node:crypto'
import { readRawBody, getHeader, setResponseStatus } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

const shortenFloats = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(shortenFloats)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, shortenFloats(x)]))
  if (typeof v === 'number' && !Number.isInteger(v) && v % 1 === 0) return Math.trunc(v)
  return v
}
const sortKeys = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    return Object.keys(v as object).sort().reduce<Record<string, unknown>>((acc, k) => { acc[k] = sortKeys((v as Record<string, unknown>)[k]); return acc }, {})
  }
  return v
}

/** Didit decision webhook: X-Signature-V2 HMAC, signed-timestamp freshness, event_id idempotency. */
export default defineEventHandler(async (event) => {
  const secret = process.env.DIDIT_WEBHOOK_SECRET
  if (!secret) { setResponseStatus(event, 503); return 'not configured' }
  const raw = await readRawBody(event, 'utf8') ?? ''
  const sig = String(getHeader(event, 'x-signature-v2') ?? '')
  let parsed: Record<string, any>
  try { parsed = JSON.parse(raw) } catch { setResponseStatus(event, 400); return 'bad json' }

  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(sortKeys(shortenFloats(parsed))), 'utf8').digest('hex')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    setResponseStatus(event, 401); return 'bad sig'
  }
  const ts = Number(parsed.timestamp)
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) { setResponseStatus(event, 401); return 'stale' }

  const db = getServiceClient()
  const { error: dup } = await db.from('didit_webhook_events' as never).insert({ event_id: String(parsed.event_id) } as never)
  if (dup) return 'ok'

  const { data: req } = await db.from('kyc_requests' as never).select('id, user_id, status')
    .eq('didit_session_id', String(parsed.session_id)).maybeSingle()
  const r = req as { id: string, user_id: string, status: string } | null
  if (!r || r.user_id !== String(parsed.vendor_data)) return 'ok'
  await applyDiditDecision(event, r, String(parsed.status), parsed.decision ?? null)
  return 'ok'
})
