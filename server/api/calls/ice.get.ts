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

  if (config.cloudflareTurnKeyId && config.cloudflareTurnApiToken) {
    iceServers.push(...await cloudflareIceServers(String(config.cloudflareTurnKeyId), String(config.cloudflareTurnApiToken)))
  }

  const urls = String(config.turnUrls || '').split(',').map(url => url.trim()).filter(Boolean)
  if (urls.length && config.turnUsername && config.turnCredential) {
    iceServers.push({ urls, username: String(config.turnUsername), credential: String(config.turnCredential) })
  }

  const relay = iceServers.some(server => [server.urls].flat().some(url => String(url).startsWith('turn')))
  return { iceServers, relay }
})
