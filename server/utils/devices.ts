import type { H3Event } from 'h3'
import { getRequestHeader, getRequestIP } from 'h3'

export const ONLINE_WINDOW_MS = 6 * 60 * 1000

/** session_id and aal claims of the caller's access token (Supabase already verified it). */
export const tokenClaims = (event: H3Event): { session_id: string | null, aal: string | null } => {
  const token = (event.context as { accessToken?: string | null }).accessToken
  const part = token?.split('.')[1]
  if (!part) return { session_id: null, aal: null }
  try {
    const c = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { session_id?: string, aal?: string }
    return { session_id: c.session_id ?? null, aal: c.aal ?? null }
  } catch {
    return { session_id: null, aal: null }
  }
}

export const requestIp = (event: H3Event) => getRequestIP(event, { xForwardedFor: true })?.split(',')[0]?.trim() || null

export const deviceLabel = (ua: string) => {
  const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ios/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows' : /mac os/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Unknown OS'
  const app = /capacitor|; wv\)/i.test(ua) ? 'Viorp app'
    : /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /phx|phoenix/i.test(ua) ? 'Phoenix' : /samsungbrowser/i.test(ua) ? 'Samsung Internet'
      : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Browser'
  return `${app} on ${os}`
}

/** Approximate city/country for an IP; null when unknown. Never blocks for long. */
export const approxLocation = async (event: H3Event, ip: string | null): Promise<string | null> => {
  const country = getRequestHeader(event, 'cf-ipcountry')
  if (!ip || /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd)/.test(ip)) return country ?? null
  try {
    const r = await $fetch<{ success?: boolean, city?: string, region?: string, country?: string }>(`https://ipwho.is/${encodeURIComponent(ip)}`, { timeout: 2500, retry: 0 })
    if (r?.success) return [r.city, r.region, r.country].filter(Boolean).join(', ') || null
  } catch { /* location is best effort */ }
  return country ?? null
}
