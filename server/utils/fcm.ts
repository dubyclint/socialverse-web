import { createSign } from 'node:crypto'

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

export interface FcmMessage {
  token: string
  title: string
  body: string
  data?: Record<string, string>
  /** Android notification channel; `calls` rings with high importance. */
  channel?: string
  /** Seconds before an undelivered message is dropped. */
  ttl?: number
  /** Data-only push: the Android app builds its own (full-screen call) notification. */
  dataOnly?: boolean
}

let account: ServiceAccount | null | undefined
let cachedToken: { value: string, expires: number } | null = null

const serviceAccount = (): ServiceAccount | null => {
  if (account !== undefined) return account
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  try {
    const parsed = raw ? JSON.parse(raw) as ServiceAccount : null
    account = parsed?.client_email && parsed.private_key && parsed.project_id
      ? { ...parsed, private_key: parsed.private_key.replace(/\\n/g, '\n') }
      : null
  } catch {
    account = null
  }
  if (!account) console.warn('[fcm] FIREBASE_SERVICE_ACCOUNT is missing or invalid; push is off')
  return account
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString('base64url')

const accessToken = async (sa: ServiceAccount): Promise<string> => {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }))
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(sa.private_key).toString('base64url')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${signature}` })
  })
  if (!res.ok) throw new Error(`Google token request failed (${res.status})`)
  const json = await res.json() as { access_token: string, expires_in: number }
  cachedToken = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

export const pushEnabled = () => Boolean(serviceAccount())

/** Sends one FCM HTTP v1 message. Returns 'invalid' when the token is dead and should be cleared. */
export const sendFcm = async (msg: FcmMessage): Promise<'sent' | 'invalid' | 'skipped' | 'failed'> => {
  const sa = serviceAccount()
  if (!sa) return 'skipped'
  try {
    const token = await accessToken(sa)
    const ttl = `${msg.ttl ?? 86400}s`
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: msg.token,
          ...(msg.dataOnly ? {} : { notification: { title: msg.title, body: msg.body } }),
          data: msg.data ?? {},
          android: {
            priority: 'HIGH',
            ttl,
            ...(msg.dataOnly
              ? {}
              : { notification: { channel_id: msg.channel ?? 'default', sound: 'default', default_vibrate_timings: true } })
          },
          apns: msg.dataOnly
            ? { headers: { 'apns-priority': '5', 'apns-push-type': 'background' }, payload: { aps: { 'content-available': 1 } } }
            : { headers: { 'apns-priority': '10' }, payload: { aps: { sound: 'default' } } }
        }
      })
    })
    if (res.ok) return 'sent'
    const text = await res.text()
    if (res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT.*token/i.test(text)) return 'invalid'
    console.error('[fcm] send failed', res.status, text.slice(0, 300))
    return 'failed'
  } catch (e) {
    console.error('[fcm] send error', e)
    return 'failed'
  }
}
