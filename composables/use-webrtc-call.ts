import { ref, shallowRef, computed } from 'vue'
import { useSocket } from '~/composables/use-socket'

export interface ActiveCall {
  id: string
  chatId: string
  peerId: string
  peerName?: string
  peerAvatar?: string
  callType: 'audio' | 'video'
  isIncoming: boolean
  isActive: boolean
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
const remoteStream = shallowRef<MediaStream | null>(null)
const error = ref<string | null>(null)
const isMuted = ref(false)
const isVideoOff = ref(false)
const isInCall = computed(() => call.value !== null)

let pc: RTCPeerConnection | null = null
// ICE can arrive before the remote description is set; queue until it is.
let pendingCandidates: RTCIceCandidateInit[] = []
let listenersBound = false
// The caller sends its offer only once the callee has accepted and is ready
// to answer; this is set when acceptance arrives before local media is.
let offerPending = false
let ringTimer: ReturnType<typeof setTimeout> | null = null
const RING_TIMEOUT_MS = 45_000

/**
 * 1:1 audio/video calling. Signalling is relayed by the socket server, which
 * authorises every message against the `call_sessions` row, so peers can only
 * exchange SDP/ICE for a call they actually belong to. Call state is shared
 * app-wide so an incoming call rings on any page.
 */
export const useWebrtcCall = () => {
  const { socket } = useSocket()

  const signal = (payloadType: string, payload: unknown) => {
    if (!call.value) return
    socket?.emit('call:signal', { callId: call.value.id, payloadType, payload })
  }

  const createPeer = async (callType: 'audio' | 'video') => {
    pc = new RTCPeerConnection(await loadIceConfig())
    remoteStream.value = new MediaStream()

    localStream.value = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video'
    })
    localStream.value.getTracks().forEach(track => pc?.addTrack(track, localStream.value!))

    pc.ontrack = event => {
      event.streams[0]?.getTracks().forEach(track => remoteStream.value?.addTrack(track))
    }

    pc.onicecandidate = event => {
      if (event.candidate) signal('ice', event.candidate.toJSON())
    }

    pc.onconnectionstatechange = () => {
      if (pc?.connectionState === 'failed') {
        error.value = 'The call could not connect on this network'
        hangUp()
      }
    }

    return pc
  }

  const sendOffer = async () => {
    if (!pc) {
      offerPending = true
      return
    }
    offerPending = false
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    signal('offer', offer)
  }

  const clearRing = () => {
    if (ringTimer) clearTimeout(ringTimer)
    ringTimer = null
  }

  const startRing = (onTimeout: () => void) => {
    clearRing()
    ringTimer = setTimeout(() => {
      if (call.value && !call.value.isActive) onTimeout()
    }, RING_TIMEOUT_MS)
  }

  const drainCandidates = async () => {
    for (const candidate of pendingCandidates) {
      await pc?.addIceCandidate(new RTCIceCandidate(candidate))
    }
    pendingCandidates = []
  }

  const cleanup = () => {
    clearRing()
    offerPending = false
    localStream.value?.getTracks().forEach(track => track.stop())
    pc?.close()
    pc = null
    pendingCandidates = []
    localStream.value = null
    remoteStream.value = null
    call.value = null
    isMuted.value = false
    isVideoOff.value = false
  }

  const startCall = async (params: {
    chatId: string
    targetUserId: string
    callType: 'audio' | 'video'
    peerName?: string
    peerAvatar?: string
  }) => {
    error.value = null
    if (call.value) return
    const callType = params.callType === 'video' ? 'video' : 'audio'

    socket?.emit(
      'call:invite',
      { chatId: params.chatId, targetUserId: params.targetUserId, callType },
      async (result: { success: boolean; call?: { id: string }; error?: string }) => {
        if (!result?.success || !result.call) {
          error.value = result?.error || 'Failed to start call'
          return
        }

        call.value = {
          id: result.call.id,
          chatId: params.chatId,
          peerId: params.targetUserId,
          peerName: params.peerName,
          peerAvatar: params.peerAvatar,
          callType,
          isIncoming: false,
          isActive: false
        }
        startRing(() => {
          error.value = 'No answer'
          hangUp()
        })

        try {
          await createPeer(callType)
          if (offerPending) await sendOffer()
        } catch (err) {
          error.value = err instanceof Error ? err.message : 'Could not access microphone/camera'
          hangUp()
        }
      }
    )
  }

  const acceptCall = async () => {
    if (!call.value) return
    try {
      clearRing()
      await createPeer(call.value.callType)
      socket?.emit('call:accept', { callId: call.value.id })
      call.value = { ...call.value, isActive: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not access microphone/camera'
      hangUp()
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
  }) => {
    if (call.value) {
      socket?.emit('call:reject', { callId: data.id })
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
    startRing(rejectCall)
  }

  const onSignal = async (data: { callId: string; payloadType: string; payload: any }) => {
    if (!call.value || data.callId !== call.value.id || !pc) return

    if (data.payloadType === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data.payload))
      await drainCandidates()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      signal('answer', answer)
      return
    }

    if (data.payloadType === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data.payload))
      await drainCandidates()
      return
    }

    if (data.payloadType === 'ice') {
      if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(data.payload))
      else pendingCandidates.push(data.payload)
    }
  }

  const onAccepted = async (data?: { id?: string }) => {
    if (!call.value || (data?.id && data.id !== call.value.id)) return
    clearRing()
    const isCaller = !call.value.isIncoming
    call.value = { ...call.value, isActive: true }
    if (!isCaller) return
    try {
      await sendOffer()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect the call'
      hangUp()
    }
  }

  if (socket && !listenersBound) {
    listenersBound = true
    socket.on('call:incoming', onIncoming)
    socket.on('call:signal', onSignal)
    socket.on('call:accepted', onAccepted)
    socket.on('call:rejected', cleanup)
    socket.on('call:ended', cleanup)
  }

  return {
    call,
    isInCall,
    localStream,
    remoteStream,
    error,
    isMuted,
    isVideoOff,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleVideo
  }
}
