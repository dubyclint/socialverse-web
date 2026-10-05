import { ref, shallowRef, computed, markRaw } from 'vue'
import { useSocket } from '~/composables/use-socket'

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
}

const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
}

let iceConfig: RTCConfiguration | null = null
const loadIceConfig = async (): Promise<RTCConfiguration> => {
  if (iceConfig) return iceConfig
  try {
    const res = await $fetch<{ iceServers: RTCIceServer[] }>('/api/calls/ice')
    iceConfig = { iceServers: res.iceServers }
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
const isInCall = computed(() => call.value !== null)

const peers = new Map<string, Peer>()
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

  const acquireMedia = async (callType: 'audio' | 'video') => {
    if (localStream.value) return localStream.value
    localStream.value = markRaw(await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video'
    }))
    return localStream.value
  }

  const closePeer = (userId: string) => {
    peers.get(userId)?.pc.close()
    peers.delete(userId)
  }

  const peerFor = async (userId: string): Promise<Peer> => {
    const existing = peers.get(userId)
    if (existing) return existing

    const pc = new RTCPeerConnection(await loadIceConfig())
    const peer: Peer = { pc, pending: [] }
    peers.set(userId, peer)

    const stream = localStream.value
    stream?.getTracks().forEach(track => pc.addTrack(track, stream))

    const remote = markRaw(new MediaStream())
    setParticipant(userId, { stream: remote })
    pc.ontrack = event => {
      const tracks = event.streams[0]?.getTracks() ?? [event.track]
      tracks.forEach(track => {
        if (!remote.getTracks().includes(track)) remote.addTrack(track)
      })
      setParticipant(userId, { stream: remote, state: 'connected' })
    }

    pc.onicecandidate = event => {
      if (event.candidate) signal(userId, 'ice', event.candidate.toJSON())
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setParticipant(userId, { state: 'connected' })
      if (pc.connectionState === 'failed') {
        closePeer(userId)
        dropParticipant(userId)
        if (!peers.size) {
          error.value = 'The call could not connect on this network'
          hangUp()
        }
      }
    }

    return peer
  }

  const drainCandidates = async (peer: Peer) => {
    for (const candidate of peer.pending) await peer.pc.addIceCandidate(new RTCIceCandidate(candidate))
    peer.pending = []
  }

  const sendOffer = async (userId: string) => {
    const peer = await peerFor(userId)
    const offer = await peer.pc.createOffer()
    await peer.pc.setLocalDescription(offer)
    signal(userId, 'offer', offer)
  }

  const cleanup = () => {
    clearRing()
    localStream.value?.getTracks().forEach(track => track.stop())
    for (const userId of [...peers.keys()]) closePeer(userId)
    localStream.value = null
    participants.value = []
    call.value = null
    isMuted.value = false
    isVideoOff.value = false
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

    try {
      await acquireMedia(callType)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not access microphone/camera'
      cleanup()
      return
    }

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
    try {
      clearRing()
      await acquireMedia(call.value.callType)
      socket?.emit('call:accept', { callId: call.value.id })
      call.value = { ...call.value, isActive: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not access microphone/camera'
      rejectCall()
    }
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

  const onSignal = async (data: { callId: string, senderId: string, payloadType: string, payload: any }) => {
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
    localStream,
    participants,
    error,
    isMuted,
    isVideoOff,
    startCall,
    addParticipants,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleVideo
  }
}
