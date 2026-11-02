import { onUnmounted, ref, shallowRef } from 'vue'
import { fetchStreamTransport, type StreamTransport } from '~/composables/use-stream-whip'

const STUN: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]

export interface LiveViewer { id: string, name: string, avatar: string | null }
export type LiveEvent = { type: string, [key: string]: any }

const waitIce = (pc: RTCPeerConnection) => new Promise<void>((resolve) => {
  if (pc.iceGatheringState === 'complete') return resolve()
  const t = setTimeout(resolve, 2500)
  pc.addEventListener('icegatheringstatechange', () => {
    if (pc.iceGatheringState === 'complete') { clearTimeout(t); resolve() }
  })
})

const whipExchange = async (pc: RTCPeerConnection, url: string, token?: string) => {
  await pc.setLocalDescription(await pc.createOffer())
  await waitIce(pc)
  const headers: Record<string, string> = { 'Content-Type': 'application/sdp' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { method: 'POST', headers, body: pc.localDescription?.sdp ?? '' })
  if (!res.ok) throw new Error(`Media server rejected the session (${res.status})`)
  await pc.setRemoteDescription({ type: 'answer', sdp: await res.text() })
}

/**
 * One live room connection: signed socket join, WebRTC mesh (with TURN from
 * /api/calls/ice) or WHIP/WHEP media server, presence, likes and live events.
 */
export const useLiveRoom = () => {
  const connected = ref(false)
  const viewerCount = ref(0)
  const topViewers = ref<LiveViewer[]>([])
  const likes = ref(0)
  const remoteStream = shallowRef<MediaStream | null>(null)
  const waiting = ref(true)
  const ended = ref(false)
  const mode = ref<'mesh' | 'whip'>('mesh')
  const error = ref('')
  const listeners = new Set<(e: LiveEvent) => void>()
  const peerId = `p_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36).slice(-4)}`

  let socket: WebSocket | null = null
  let streamId = ''
  let role: 'broadcaster' | 'viewer' = 'viewer'
  let transport: StreamTransport | null = null
  let ice: RTCIceServer[] = STUN
  let localStream: MediaStream | null = null
  const pcs = new Map<string, RTCPeerConnection>()
  let viewerPc: RTCPeerConnection | null = null
  let mediaPc: RTCPeerConnection | null = null
  let closedByUser = false
  let retries = 0
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let lastSample: { bytes: number, at: number } | null = null
  let broadcasterPeerId: string | null = null
  // Guest seats: guest -> host uplink (guest side), host <- guests (host side).
  let uplink: RTCPeerConnection | null = null
  const returnAudio = shallowRef<MediaStream | null>(null)
  const guestPcs = new Map<string, { pc: RTCPeerConnection, userId: string }>()
  const guestStreams = ref<{ peerId: string, userId: string, stream: MediaStream }[]>([])
  let guestAllowed: (userId: string) => boolean = () => false
  let returnTrackFor: (userId: string) => MediaStreamTrack | null = () => null

  const send = (m: Record<string, unknown>) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(m)) }
  const on = (fn: (e: LiveEvent) => void) => { listeners.add(fn); return () => listeners.delete(fn) }

  const offerTo = async (viewerId: string) => {
    if (!localStream || mode.value !== 'mesh') return
    pcs.get(viewerId)?.close()
    const pc = new RTCPeerConnection({ iceServers: ice })
    pcs.set(viewerId, pc)
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream as MediaStream))
    pc.onicecandidate = (e) => { if (e.candidate) send({ type: 'signal', to: viewerId, payload: { kind: 'ice', candidate: e.candidate.toJSON() } }) }
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { pc.close(); pcs.delete(viewerId) } }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    send({ type: 'signal', to: viewerId, payload: { kind: 'offer', sdp: offer } })
  }

  const dropGuest = (peerId: string) => {
    guestPcs.get(peerId)?.pc.close()
    guestPcs.delete(peerId)
    guestStreams.value = guestStreams.value.filter(g => g.peerId !== peerId)
  }

  const handleGuestSignal = async (m: LiveEvent) => {
    const p = m.payload as { kind: string, sdp?: RTCSessionDescriptionInit, candidate?: RTCIceCandidateInit }
    if (role === 'broadcaster') {
      if (p.kind === 'offer' && p.sdp) {
        if (!m.fromUser || !guestAllowed(m.fromUser)) return
        dropGuest(m.from)
        const pc = new RTCPeerConnection({ iceServers: ice })
        guestPcs.set(m.from, { pc, userId: m.fromUser })
        pc.ontrack = (e) => {
          const stream = e.streams[0] ?? new MediaStream([e.track])
          guestStreams.value = [...guestStreams.value.filter(g => g.peerId !== m.from), { peerId: m.from, userId: m.fromUser, stream }]
        }
        pc.onicecandidate = (e) => { if (e.candidate) send({ type: 'signal', to: m.from, payload: { channel: 'guest', kind: 'ice', candidate: e.candidate.toJSON() } }) }
        pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) dropGuest(m.from) }
        await pc.setRemoteDescription(p.sdp)
        const back = returnTrackFor(m.fromUser)
        const audioTx = pc.getTransceivers().find(t => t.receiver.track.kind === 'audio')
        if (back && audioTx) { audioTx.direction = 'sendrecv'; await audioTx.sender.replaceTrack(back) }
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        send({ type: 'signal', to: m.from, payload: { channel: 'guest', kind: 'answer', sdp: answer } })
      } else if (p.kind === 'ice' && p.candidate) {
        await guestPcs.get(m.from)?.pc.addIceCandidate(p.candidate).catch(() => {})
      }
      return
    }
    if (!uplink) return
    if (p.kind === 'answer' && p.sdp) await uplink.setRemoteDescription(p.sdp)
    else if (p.kind === 'ice' && p.candidate) await uplink.addIceCandidate(p.candidate).catch(() => {})
  }

  /** Guest side: send camera+mic to the host, who composites guests into the LIVE. */
  const startGuestUplink = async (media: MediaStream) => {
    if (!broadcasterPeerId) throw new Error('The host is not connected')
    stopGuestUplink()
    const pc = new RTCPeerConnection({ iceServers: ice })
    uplink = pc
    media.getTracks().forEach(t => pc.addTrack(t, media))
    pc.ontrack = (e) => { returnAudio.value = e.streams[0] ?? new MediaStream([e.track]) }
    pc.onicecandidate = (e) => { if (e.candidate && broadcasterPeerId) send({ type: 'signal', to: broadcasterPeerId, payload: { channel: 'guest', kind: 'ice', candidate: e.candidate.toJSON() } }) }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    send({ type: 'signal', to: broadcasterPeerId, payload: { channel: 'guest', kind: 'offer', sdp: offer } })
  }
  const stopGuestUplink = () => { uplink?.close(); uplink = null; returnAudio.value = null }
  const setGuestPolicy = (allowed: (userId: string) => boolean, returnTrack: (userId: string) => MediaStreamTrack | null) => {
    guestAllowed = allowed
    returnTrackFor = returnTrack
    for (const [peerId, g] of guestPcs) if (!allowed(g.userId)) dropGuest(peerId)
  }
  /** Refresh each guest's return audio (host + the other guests) after the seat list changes. */
  const refreshReturnAudio = async () => {
    for (const g of guestPcs.values()) {
      const t = returnTrackFor(g.userId)
      const tx = g.pc.getTransceivers().find(x => x.receiver.track.kind === 'audio')
      if (t && tx) await tx.sender.replaceTrack(t).catch(() => {})
    }
  }

  const handleSignal = async (m: LiveEvent) => {
    const p = m.payload as { kind: string, channel?: string, sdp?: RTCSessionDescriptionInit, candidate?: RTCIceCandidateInit }
    if (p.channel === 'guest') return handleGuestSignal(m)
    if (role === 'broadcaster') {
      const pc = pcs.get(m.from)
      if (!pc) return
      if (p.kind === 'answer' && p.sdp) await pc.setRemoteDescription(p.sdp)
      else if (p.kind === 'ice' && p.candidate) await pc.addIceCandidate(p.candidate).catch(() => {})
      return
    }
    if (p.kind === 'offer' && p.sdp) {
      viewerPc?.close()
      const pc = new RTCPeerConnection({ iceServers: ice })
      viewerPc = pc
      pc.ontrack = (e) => { remoteStream.value = e.streams[0] ?? new MediaStream([e.track]); waiting.value = false }
      pc.onicecandidate = (e) => { if (e.candidate) send({ type: 'signal', to: m.from, payload: { kind: 'ice', candidate: e.candidate.toJSON() } }) }
      await pc.setRemoteDescription(p.sdp)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      send({ type: 'signal', to: m.from, payload: { kind: 'answer', sdp: answer } })
    } else if (p.kind === 'ice' && p.candidate && viewerPc) {
      await viewerPc.addIceCandidate(p.candidate).catch(() => {})
    }
  }

  const handle = async (m: LiveEvent) => {
    switch (m.type) {
      case 'joined':
        connected.value = true
        retries = 0
        if (m.broadcasterPeerId) broadcasterPeerId = m.broadcasterPeerId
        if (typeof m.likes === 'number') likes.value = m.likes
        if (role === 'broadcaster') for (const id of (m.viewers as string[] | undefined) ?? []) await offerTo(id)
        if (role === 'viewer' && mode.value === 'mesh' && !m.broadcasterOnline) waiting.value = true
        break
      case 'viewer-joined': if (role === 'broadcaster') await offerTo(m.viewerId); break
      case 'viewer-left': pcs.get(m.viewerId)?.close(); pcs.delete(m.viewerId); dropGuest(m.viewerId); break
      case 'broadcaster-ready': broadcasterPeerId = m.broadcasterPeerId ?? broadcasterPeerId; break
      case 'broadcaster-left':
        if (mode.value === 'mesh') { waiting.value = true; remoteStream.value = null; viewerPc?.close(); viewerPc = null }
        break
      case 'signal':
        if (m.from && m.payload && (mode.value === 'mesh' || (m.payload as { channel?: string }).channel === 'guest')) await handleSignal(m).catch(err => console.error('[live] signal', err))
        break
      case 'viewers': viewerCount.value = m.count ?? 0; topViewers.value = m.top ?? []; break
      case 'likes': likes.value = m.total ?? likes.value; break
      case 'ended': ended.value = true; break
      case 'error': error.value = m.message || 'Live connection error'; break
    }
    listeners.forEach(fn => fn(m))
  }

  const openSocket = () => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/api/stream/${streamId}/ws`)
    socket = ws
    ws.onopen = () => send({ type: 'join', token: transport?.wsToken, peerId, role })
    ws.onmessage = (e) => { try { void handle(JSON.parse(e.data)) } catch { /* ignore */ } }
    ws.onclose = () => {
      if (socket !== ws) return
      connected.value = false
      if (closedByUser || ended.value || retries >= 8) return
      retries++
      setTimeout(async () => {
        if (closedByUser) return
        try { transport = { ...transport, ...(await fetchStreamTransport(streamId)) } as StreamTransport } catch { /* keep old token */ }
        openSocket()
      }, Math.min(1000 * 2 ** retries, 15000))
    }
  }

  const connect = async (id: string, asRole: 'broadcaster' | 'viewer', media?: MediaStream | null) => {
    streamId = id
    role = asRole
    localStream = media ?? null
    closedByUser = false
    ended.value = false
    const [t, iceRes] = await Promise.all([
      fetchStreamTransport(id),
      $fetch<{ iceServers: RTCIceServer[] }>('/api/calls/ice').catch(() => null)
    ])
    transport = t
    mode.value = t.mode
    if (iceRes?.iceServers?.length) ice = iceRes.iceServers
    openSocket()
    pingTimer = setInterval(() => send({ type: 'ping' }), 25000)
    if (t.mode !== 'whip') return
    const pc = new RTCPeerConnection({ iceServers: ice })
    mediaPc = pc
    if (asRole === 'broadcaster') {
      if (!t.ingestUrl || !media) throw new Error('No ingest URL configured for this stream')
      media.getTracks().forEach(tr => pc.addTrack(tr, media))
      await whipExchange(pc, t.ingestUrl, t.token)
    } else {
      if (!t.playbackUrl) throw new Error('No playback URL configured for this stream')
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })
      const ms = new MediaStream()
      pc.ontrack = (e) => { ms.addTrack(e.track); remoteStream.value = ms; waiting.value = false }
      await whipExchange(pc, t.playbackUrl, t.token)
    }
  }

  const allPcs = () => [...pcs.values(), ...(mediaPc ? [mediaPc] : [])]

  /** Swap camera/mic mid-live (flip camera, change quality) without renegotiating. */
  const replaceStream = async (stream: MediaStream) => {
    localStream = stream
    for (const pc of allPcs()) {
      for (const sender of pc.getSenders()) {
        const next = stream.getTracks().find(t => t.kind === sender.track?.kind)
        if (next) await sender.replaceTrack(next).catch(() => {})
      }
    }
  }

  const sampleStats = async (): Promise<{ bitrate: number, fps: number }> => {
    let bytes = 0
    let fps = 0
    for (const pc of allPcs()) {
      const report = await pc.getStats().catch(() => null)
      report?.forEach((s: any) => {
        if (s.type === 'outbound-rtp' && s.kind === 'video') { bytes += s.bytesSent ?? 0; fps = Math.max(fps, s.framesPerSecond ?? 0) }
      })
    }
    const at = Date.now()
    const prev = lastSample
    lastSample = { bytes, at }
    const bitrate = prev && at > prev.at && bytes >= prev.bytes ? Math.round(((bytes - prev.bytes) * 8) / (at - prev.at)) : 0
    return { bitrate, fps: Math.round(fps) }
  }

  const sendLike = (n = 1) => send({ type: 'like', n })

  const disconnect = () => {
    closedByUser = true
    if (pingTimer) clearInterval(pingTimer)
    pingTimer = null
    pcs.forEach(pc => pc.close())
    pcs.clear()
    guestPcs.forEach(g => g.pc.close())
    guestPcs.clear()
    guestStreams.value = []
    stopGuestUplink()
    viewerPc?.close(); viewerPc = null
    mediaPc?.close(); mediaPc = null
    const ws = socket
    socket = null
    ws?.close()
    remoteStream.value = null
    connected.value = false
  }

  onUnmounted(disconnect)

  return { connect, disconnect, on, sendLike, replaceStream, sampleStats, startGuestUplink, stopGuestUplink, setGuestPolicy, refreshReturnAudio, guestStreams, returnAudio, connected, viewerCount, topViewers, likes, remoteStream, waiting, ended, mode, error }
}
