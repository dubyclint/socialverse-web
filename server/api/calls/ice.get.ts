import { requireUser } from '~/server/utils/auth'

const STUN: RTCIceServer = { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const config = useRuntimeConfig()
  const urls = String(config.turnUrls || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)

  const iceServers: RTCIceServer[] = [STUN]
  if (urls.length && config.turnUsername && config.turnCredential) {
    iceServers.push({ urls, username: String(config.turnUsername), credential: String(config.turnCredential) })
  }
  return { iceServers, relay: iceServers.length > 1 }
})
