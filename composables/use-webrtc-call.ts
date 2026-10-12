import { ref, shallowRef, computed, markRaw } from 'vue'
import { useSocket } from '~/composables/use-socket'
import { useRingtone } from '~/composables/use-ringtone'

/** Everyone on a call, caller included. Mirrors the server cap. */
export const MAX_CALL_PARTICIPANTS = 8

export interface CallPerson {
  userId: string
  name: string
  avatar?: string
}

export interface CallParticipant extends CallPerson {
  state: 'ringing' | 'connected'
  stream: MediaStream | null
}

export interface ActiveCall {
  id: string
  chatId: string
  /** Who started the call (incoming) or the first person rung (outgoing). */
  peerId: string
  peerName?: string
  peerAvatar?: string
  callType: 'audio' | 'video'
  isIncoming: boolean
  isActive: boolean
}

interface Peer {
  pc: RTCPeerConnection
  pending: RTCIceCandidateInit[]
  /** We sent the offer, so we drive ICE restarts. */
  offerer: boolean
  restarted: boolean
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}

const videoConstraints = (facing: 'user' | 'environment'): MediaTrackConstraints => ({
  facingMode: { ideal: facing },
  width: { ideal: 1280 },
  height: { ideal: 720 }
})

const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
}

let iceConfig: RTCConfiguration | null = null
let iceLoadedAt = 0
let hasRelay = false
// TURN credentials can be short-lived, so refetch them for calls started later.
const loadIceConfig = async (): Promise<RTCConfiguration> => {
  if (iceConfig && Date.now() - iceLoadedAt < 30 * 60_000) return iceConfig
  try {
    const res = await $fetch<{ iceServers: RTCIceServer[], relay?: boolean }>('/api/calls/ice')
    iceConfig = { iceServers: res.iceServers }
    hasRelay = Boolean(res.relay)
    iceLoadedAt = Date.now()
  } catch {
    iceConfig = FALLBACK_ICE
  }
  return iceConfig
}

const call = ref<ActiveCall | null>(null)
// Shallow: a reactive proxy around a MediaStream is rejected by `srcObject`
// and breaks its native methods.
const localStream = shallowRef<MediaStream | null>(null)
const participants = shallowRef<CallParticipant[]>([])
const error = ref<string | null>(null)
const isMuted = ref(false)
const isVideoOff = ref(false)
/** Loudspeaker (full volume) vs normal earpiece-level volume. */
const speakerOn = ref(true)
const facingMode = ref<'user' | 'environment'>('user')
const isInCall = computed(() => call.value !== null)
/** Epoch ms when the first peer connection came up; drives the call timer. */
const connectedAt = ref<number | null>(null)

const mediaErrorMessage = (err: unknown, callType: 'audio' | 'video') => {
  const name = err instanceof DOMException ? err.name : ''
  const device = callType === 'video' ? 'camera and microphone' : 'microphone'
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return `Viorp can't use your ${device}. Allow it from the lock icon in the address bar (or app settings), then try again. You can still hear the other side.`
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return `No ${device} was found on this device. You can still hear the other side.`
  if (name === 'NotReadableError') return `Your ${device} is being used by another app. You can still hear the other side.`
  return `Could not access your ${device}. You can still hear the other side.`
}

const peers = new Map<string, Peer>()
const creatingPeers = new Map<string, Promise<Peer>>()
const signalQueues = new Map<string, Promise<void>>()
let listenersBound = false
let ringTimer: ReturnType<typeof setTimeout> | null = null
const RING_TIMEOUT_MS = 45_000

const setParticipant = (userId: string, patch: Partial<CallParticipant> & Partial<CallPerson>) => {
  const list = participants.value
  const index = list.findIndex(p => p.userId === userId)
  if (index === -1) {
    participants.value = [...list, { userId, name: 'Someone', state: 'ringing', stream: null, ...patch }]
  } else {
    participants.value = list.map((p, i) => (i === index ? { ...p, ...patch } : p))
  }
}

const dropParticipant = (userId: string) => {
  participants.value = participants.value.filter(p => p.userId !== userId)
}

/**
 * Mesh audio/video calling for up to MAX_CALL_PARTICIPANTS people. The socket
 * server relays SDP/ICE only between people on the same call; whoever joins
 * sends an offer to each person already there. Call state is app-wide so an
 * incoming call rings on any page.
 */
export const useWebrtcCall = () => {
  const { socket } = useSocket()

  const signal = (targetUserId: string, payloadType: string, payload: unknown) => {
    if (!call.value) return
    socket?.emit('call:signal', { callId: call.value.id, targetUserId, payloadType, payload })
  }

  const clearRing = () => {
    if (ringTimer) clearTimeout(ringTimer)
    ringTimer = null
  }

  const ringtone = useRingtone()

  // Falls back from camera+mic to mic only, then to listen-only, so a denied
  // permission degrades the call instead of killing it.
  const acquireMedia = async (callType: 'audio' | 'video'): Promise<MediaStream | null> => {
    if (localStream.value) return localStream.value
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = 'Calls need a secure (https) page and a browser with microphone support.'
      return null
    }
    try {
      localStream.value = markRaw(await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
        video: callType === 'video' ? videoConstraints(facingMode.value) : false
      }))
      return localStream.value
    } catch (err) {
      if (callType === 'video') {
        try {
          localStream.value = markRaw(await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS }))
          isVideoOff.value = true
          error.value = mediaErrorMessage(err, 'video').replace(' You can still hear the other side.', ' Continuing with audio only.')
          return localStream.value
        } catch (audioErr) {
          error.value = mediaErrorMessage(audioErr, 'video')
          return null
        }
      }
      error.value = mediaErrorMessage(err, callType)
      return null
    }
  }

  const markConnected = () => {
    if (connectedAt.value) return
    connectedAt.value = Date.now()
    ringtone.stop()
  }

  const closePeer = (userId: string) => {
    peers.get(userId)?.pc.close()
    peers.delete(userId)
    signalQueues.delete(userId)
  }

  // Offer and ICE candidates arrive back to back; they must share one connection.
  const peerFor = (userId: string): Promise<Peer> => {
    const existing = peers.get(userId)
    if (existing) return Promise.resolve(existing)
    const creating = creatingPeers.get(userId)
    if (creating) return creating
    const promise = createPeer(userId).finally(() => creatingPeers.delete(userId))
    creatingPeers.set(userId, promise)
    return promise
  }

  const createPeer = async (userId: string): Promise<Peer> => {
    const pc = new RTCPeerConnection(await loadIceConfig())
    const peer: Peer = { pc, pending: [], offerer: false, restarted: false }
    peers.set(userId, peer)

    const stream = localStream.value
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      if (call.value?.callType === 'video' && !stream.getVideoTracks().length) pc.addTransceiver('video', { direction: 'recvonly' })
    } else {
      pc.addTransceiver('audio', { direction: 'recvonly' })
      if (call.value?.callType === 'video') pc.addTransceiver('video', { direction: 'recvonly' })
    }

    // A fresh MediaStream per track change makes every <video>/<audio> rebind
    // and call play() again; mobile browsers don't render tracks added later.
    const remoteTracks: MediaStreamTrack[] = []
    pc.ontrack = event => {
      const incoming = event.streams[0]?.getTracks() ?? [event.track]
      for (const track of incoming) {
        if (!remoteTracks.includes(track)) remoteTracks.push(track)
        track.onunmute = () => setParticipant(userId, { stream: markRaw(new MediaStream(remoteTracks)) })
      }
      setParticipant(userId, { stream: markRaw(new MediaStream(remoteTracks)) })
    }

    pc.onicecandidate = event => {
      if (event.candidate) signal(userId, 'ice', event.candidate.toJSON())
    }

    // Media only flows once ICE has connected; ringing/negotiation is not "connected".
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setParticipant(userId, { state: 'connected' })
        markConnected()
      }
      if (pc.connectionState !== 'failed') return
      if (!peer.restarted) {
        peer.restarted = true
        if (peer.offerer) void sendOffer(userId, true).catch(() => undefined)
        return
      }
      closePeer(userId)
      dropParticipant(userId)
      if (!peers.size) {
        error.value = hasRelay
          ? 'The call dropped. Check your connection and try again.'
          : 'The call could not connect between these networks (mobile data needs a relay server).'
        hangUp()
      }
    }

    return peer
  }

  const drainCandidates = async (peer: Peer) => {
    for (const candidate of peer.pending) await peer.pc.addIceCandidate(new RTCIceCandidate(candidate))
    peer.pending = []
  }

  const sendOffer = async (userId: string, iceRestart = false) => {
    const peer = await peerFor(userId)
    peer.offerer = true
    const offer = await peer.pc.createOffer({ iceRestart })
    await peer.pc.setLocalDescription(offer)
    signal(userId, 'offer', offer)
  }

  const cleanup = () => {
    clearRing()
    ringtone.stop()
    connectedAt.value = null
    localStream.value?.getTracks().forEach(track => track.stop())
    for (const userId of [...peers.keys()]) closePeer(userId)
    localStream.value = null
    participants.value = []
    call.value = null
    isMuted.value = false
    isVideoOff.value = false
    facingMode.value = 'user'
  }

  const startCall = async (params: {
    chatId: string
    callType: 'audio' | 'video'
    /** Omit to ring the other member (direct) or members (group) of the chat. */
    targetUserIds?: string[]
    peerName?: string
    peerAvatar?: string
  }) => {
    error.value = null
    if (call.value) return
    const callType = params.callType === 'video' ? 'video' : 'audio'

    await acquireMedia(callType)

    socket?.emit(
      'call:invite',
      { chatId: params.chatId, targetUserIds: params.targetUserIds, callType },
      (result: { success: boolean, call?: { id: string }, invited?: CallPerson[], error?: string }) => {
        if (!result?.success || !result.call) {
          error.value = result?.error || 'Failed to start call'
          cleanup()
          return
        }

        const invited = result.invited ?? []
        call.value = {
          id: result.call.id,
          chatId: params.chatId,
          peerId: invited[0]?.userId ?? '',
          peerName: params.peerName ?? invited[0]?.name,
          peerAvatar: params.peerAvatar ?? invited[0]?.avatar,
          callType,
          isIncoming: false,
          isActive: false
        }
        participants.value = invited.map(person => ({ ...person, state: 'ringing', stream: null }))
        ringtone.ring('outgoing')
        ringTimer = setTimeout(() => {
          if (call.value && !call.value.isActive) {
            error.value = 'No answer'
            hangUp()
          }
        }, RING_TIMEOUT_MS)
      }
    )
  }

  const addParticipants = (userIds: string[]) =>
    new Promise<void>(resolve => {
      if (!call.value || !userIds.length) return resolve()
      socket?.emit('call:add', { callId: call.value.id, userIds }, (result: { success: boolean, invited?: CallPerson[], error?: string }) => {
        if (!result?.success) error.value = result?.error || 'Could not add people'
        for (const person of result?.invited ?? []) setParticipant(person.userId, { ...person, state: 'ringing' })
        resolve()
      })
    })

  const acceptCall = async () => {
    if (!call.value) return
    clearRing()
    ringtone.stop()
    await acquireMedia(call.value.callType)
    if (!call.value) return
    socket?.emit('call:accept', { callId: call.value.id })
    call.value = { ...call.value, isActive: true }
  }

  const rejectCall = () => {
    if (call.value) socket?.emit('call:reject', { callId: call.value.id })
    cleanup()
  }

  const hangUp = () => {
    if (call.value) socket?.emit('call:end', { callId: call.value.id })
    cleanup()
  }

  const toggleMute = () => {
    isMuted.value = !isMuted.value
    localStream.value?.getAudioTracks().forEach(track => (track.enabled = !isMuted.value))
  }

  const toggleVideo = () => {
    isVideoOff.value = !isVideoOff.value
    localStream.value?.getVideoTracks().forEach(track => (track.enabled = !isVideoOff.value))
  }

  const toggleSpeaker = () => {
    speakerOn.value = !speakerOn.value
  }

  // Swap the camera by asking for a new track with the other facingMode and
  // replacing it in-place on every peer connection (no renegotiation needed).
  const switchCamera = async () => {
    const stream = localStream.value
    const current = stream?.getVideoTracks()[0]
    if (!stream || !current || !navigator.mediaDevices?.getUserMedia) return
    const next = facingMode.value === 'user' ? 'environment' : 'user'
    try {
      current.stop()
      const fresh = await navigator.mediaDevices.getUserMedia({ video: videoConstraints(next) })
      const track = fresh.getVideoTracks()[0]
      if (!track) return
      track.enabled = !isVideoOff.value
      for (const { pc } of peers.values()) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video' || s.track === current)
        await sender?.replaceTrack(track)
      }
      stream.removeTrack(current)
      stream.addTrack(track)
      localStream.value = markRaw(new MediaStream(stream.getTracks()))
      facingMode.value = next
    } catch (err) {
      console.warn('[call] camera switch failed', err)
      error.value = 'Could not switch camera on this device'
    }
  }

  const onIncoming = (data: {
    id: string
    room_id: string
    host_id: string
    call_mode: string
    callerName?: string
    callerAvatar?: string
    participants?: CallPerson[]
  }) => {
    if (call.value) {
      if (call.value.id !== data.id) socket?.emit('call:reject', { callId: data.id })
      return
    }

    call.value = {
      id: data.id,
      chatId: data.room_id,
      peerId: data.host_id,
      peerName: data.callerName,
      peerAvatar: data.callerAvatar,
      callType: data.call_mode === 'VIDEO' ? 'video' : 'audio',
      isIncoming: true,
      isActive: false
    }
    participants.value = (data.participants ?? []).map(person => ({ ...person, state: 'connected', stream: null }))
    clearRing()
    ringtone.ring('incoming')
    ringTimer = setTimeout(() => {
      if (call.value && !call.value.isActive) rejectCall()
    }, RING_TIMEOUT_MS)
  }

  // We just joined: offer to everyone already on the call.
  const onAccepted = async (data: { callId: string, participants?: CallPerson[] }) => {
    if (!call.value || data.callId !== call.value.id) return
    clearRing()
    call.value = { ...call.value, isActive: true }
    for (const person of data.participants ?? []) {
      setParticipant(person.userId, { ...person, state: 'ringing' })
      try {
        await sendOffer(person.userId)
      } catch {
        closePeer(person.userId)
        dropParticipant(person.userId)
      }
    }
  }

  // Someone joined: they will send us an offer.
  const onParticipantJoined = (data: { callId: string, person: CallPerson }) => {
    if (!call.value || data.callId !== call.value.id) return
    clearRing()
    ringtone.stop()
    call.value = { ...call.value, isActive: true }
    setParticipant(data.person.userId, { ...data.person, state: 'ringing' })
  }

  const onParticipantsInvited = (data: { callId: string, people: CallPerson[] }) => {
    if (!call.value || data.callId !== call.value.id) return
    for (const person of data.people) setParticipant(person.userId, { ...person, state: 'ringing' })
  }

  const onParticipantLeft = (data: { callId: string, userId: string }) => {
    if (!call.value || data.callId !== call.value.id) return
    closePeer(data.userId)
    dropParticipant(data.userId)
  }

  // Signals from one sender are applied strictly in order.
  const onSignal = (data: { callId: string, senderId: string, payloadType: string, payload: any }) => {
    if (!data?.senderId) return
    const previous = signalQueues.get(data.senderId) ?? Promise.resolve()
    const next = previous
      .then(() => applySignal(data))
      .catch((err) => console.warn('[call] signal failed', data.payloadType, err))
    signalQueues.set(data.senderId, next)
  }

  const applySignal = async (data: { callId: string, senderId: string, payloadType: string, payload: any }) => {
    if (!call.value || data.callId !== call.value.id || !call.value.isActive || !data.senderId) return
    const peer = await peerFor(data.senderId)

    if (data.payloadType === 'offer') {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.payload))
      await drainCandidates(peer)
      const answer = await peer.pc.createAnswer()
      await peer.pc.setLocalDescription(answer)
      signal(data.senderId, 'answer', answer)
      return
    }

    if (data.payloadType === 'answer') {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.payload))
      await drainCandidates(peer)
      return
    }

    if (data.payloadType === 'ice') {
      if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(new RTCIceCandidate(data.payload))
      else peer.pending.push(data.payload)
    }
  }

  const onEnded = (data?: { callId?: string }) => {
    if (!call.value || (data?.callId && data.callId !== call.value.id)) return
    cleanup()
  }

  if (socket && !listenersBound) {
    listenersBound = true
    socket.on('call:incoming', onIncoming)
    socket.on('call:signal', onSignal)
    socket.on('call:accepted', onAccepted)
    socket.on('call:participant-joined', onParticipantJoined)
    socket.on('call:participants-invited', onParticipantsInvited)
    socket.on('call:participant-left', onParticipantLeft)
    socket.on('call:ended', onEnded)
  }

  return {
    call,
    isInCall,
    connectedAt,
    localStream,
    participants,
    error,
    isMuted,
    isVideoOff,
    speakerOn,
    facingMode,
    startCall,
    addParticipants,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    switchCamera
  }
}
