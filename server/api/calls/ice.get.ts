import { requireUser } from '~/server/utils/auth'

const STUN: RTCIceServer = { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }

/** Short-lived Cloudflare Realtime TURN credentials, minted per request. */
const cloudflareIceServers = async (keyId: string, token: string): Promise<RTCIceServer[]> => {
  try {
    const res = await $fetch<{ iceServers: RTCIceServer[] }>(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: { ttl: 86400 } }
    )
    return res.iceServers ?? []
  } catch (err) {
    console.error('[calls/ice] Cloudflare TURN credentials failed:', err)
    return []
  }
}

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const config = useRuntimeConfig()
  const iceServers: RTCIceServer[] = [STUN]

  // Read at request time too: runtimeConfig is captured at build time, and the
  // deploy only provides these variables to the running container.
  const env = (key: string, fallback: unknown) => String(fallback || process.env[key] || '')
  const keyId = env('CLOUDFLARE_TURN_KEY_ID', config.cloudflareTurnKeyId)
  const token = env('CLOUDFLARE_TURN_API_TOKEN', config.cloudflareTurnApiToken)
  if (keyId && token) iceServers.push(...await cloudflareIceServers(keyId, token))

  const urls = env('TURN_URLS', config.turnUrls).split(',').map(url => url.trim()).filter(Boolean)
  const username = env('TURN_USERNAME', config.turnUsername)
  const credential = env('TURN_CREDENTIAL', config.turnCredential)
  if (urls.length && username && credential) iceServers.push({ urls, username, credential })

  const relay = iceServers.some(server => [server.urls].flat().some(url => String(url).startsWith('turn')))
  return { iceServers, relay }
})
