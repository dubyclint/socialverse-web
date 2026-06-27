// FILE : composables/use-stream-broadcast.ts - COMPLETE PRODUCTION-READY COMPOSABLE
// ============================================================================
// STREAM BROADCAST COMPOSABLE - HANDLES STREAMING & BROADCASTING
// ============================================================================

import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface StreamConfig {
  streamId?: string
  title: string
  category: string
  privacy: 'public' | 'pals-only' | 'private'
  quality: '1080p' | '720p' | '480p' | '360p'
  enableRecording: boolean
  mediaStream: MediaStream
}

export interface StreamStats {
  bitrate: number
  frameRate: number
  resolution: string
  bandwidth: number
  latency: number
}

export const useStreamBroadcast = () => {
  const isRecording = ref(false)
  const isLive = ref(false)
  const isStopping = ref(false)
  const isConnecting = ref(false)
  const viewerCount = ref(0)
  const streamDuration = ref(0)
  const streamStats: Ref<StreamStats | null> = ref(null)
  const error: Ref<string | null> = ref(null)
  const streamId: Ref<string | null> = ref(null)
  const currentConfig: Ref<StreamConfig | null> = ref(null)

  let peerConnection: RTCPeerConnection | null = null
  let mediaRecorder: MediaRecorder | null = null
  let durationInterval: NodeJS.Timeout | null = null
  let statsInterval: NodeJS.Timeout | null = null
  let viewerCountInterval: NodeJS.Timeout | null = null

  // Quality presets
  const qualityPresets = {
    '1080p': { bitrate: 5000, width: 1920, height: 1080, frameRate: 30 },
    '720p': { bitrate: 2500, width: 1280, height: 720, frameRate: 30 },
    '480p': { bitrate: 1000, width: 854, height: 480, frameRate: 24 },
    '360p': { bitrate: 500, width: 640, height: 360, frameRate: 24 }
  }

  // Initialize WebRTC connection
  const initializeWebRTC = async (config: StreamConfig) => {
    try {
      const iceServers = [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
        { urls: ['stun:stun2.l.google.com:19302'] }
      ]

      peerConnection = new RTCPeerConnection({
        iceServers
      })

      // Add media stream tracks
      config.mediaStream.getTracks().forEach(track => {
        peerConnection?.addTrack(track, config.mediaStream)
      })

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to server
          sendToServer({
            type: 'ice-candidate',
            candidate: event.candidate
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection?.connectionState)
        if (peerConnection?.connectionState === 'failed') {
          error.value = 'Connection failed. Attempting to reconnect...'
        }
      }

      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // Send offer to server
      const response = await sendToServer({
        type: 'offer',
        offer: offer,
        streamConfig: config
      })

      if (response.answer) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(response.answer)
        )
      }

      return peerConnection
    } catch (err: any) {
      error.value = 'Failed to initialize WebRTC: ' + err.message
      console.error('WebRTC initialization error:', err)
      throw err
    }
  }

  // Send data to server
  const sendToServer = async (data: any) => {
    try {
      const response = await $fetch('/api/stream/broadcast', {
        method: 'POST',
        body: data
      })
      return response
    } catch (err: any) {
      console.error('Server communication error:', err)
      throw err
    }
  }

  // Start stream
  const startStream = async (config: StreamConfig) => {
    if (isRecording.value) {
      error.value = 'Stream is already running'
      return
    }

    isConnecting.value = true
    error.value = null

    try {
      currentConfig.value = config

      // Initialize WebRTC
      await initializeWebRTC(config)

      // Start recording if enabled
      if (config.enableRecording) {
        startRecording(config.mediaStream)
      }

      // Update stream state
      isRecording.value = true
      isLive.value = true
      streamId.value = config.streamId || `stream_${Date.now()}`

      // Start monitoring
      startDurationTimer()
      startStatsMonitoring()
      startViewerCountPolling()

      // Notify server
      await sendToServer({
        type: 'stream-started',
        streamId: streamId.value,
        config: config
      })

      console.log('Stream started successfully')
    } catch (err: any) {
      isRecording.value = false
      isLive.value = false
      error.value = 'Failed to start stream: ' + err.message
      console.error('Start stream error:', err)
      throw err
    } finally {
      isConnecting.value = false
    }
  }

  // Stop stream
  const stopStream = async () => {
    if (!isRecording.value) {
      error.value = 'No stream is currently running'
      return
    }

    isStopping.value = true
    error.value = null

    try {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }

      // Close WebRTC connection
      if (peerConnection) {
        peerConnection.close()
        peerConnection = null
      }

      // Stop timers
      if (durationInterval) clearInterval(durationInterval)
      if (statsInterval) clearInterval(statsInterval)
      if (viewerCountInterval) clearInterval(viewerCountInterval)

      // Update state
      isRecording.value = false
      isLive.value = false
      streamDuration.value = 0
      viewerCount.value = 0

      // Notify server
      if (streamId.value) {
        await sendToServer({
          type: 'stream-ended',
          streamId: streamId.value,
          duration: streamDuration.value
        })
      }

      console.log('Stream stopped successfully')
    } catch (err: any) {
      error.value = 'Error stopping stream: ' + err.message
      console.error('Stop stream error:', err)
    } finally {
      isStopping.value = false
    }
  }

  // Start recording
  const startRecording = (mediaStream: MediaStream) => {
    try {
      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      }

      // Fallback if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm'
      }

      mediaRecorder = new MediaRecorder(mediaStream, options)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        await uploadRecording(blob)
      }

      mediaRecorder.start()
    } catch (err: any) {
      console.error('Recording error:', err)
      error.value = 'Failed to start recording: ' + err.message
    }
  }

  // Upload recording
  const uploadRecording = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', blob, `stream_${streamId.value}_${Date.now()}.webm`)
      formData.append('streamId', streamId.value || '')

      await $fetch('/api/stream/upload-recording', {
        method: 'POST',
        body: formData
      })

      console.log('Recording uploaded successfully')
    } catch (err: any) {
      console.error('Upload error:', err)
    }
  }

  // Start duration timer
  const startDurationTimer = () => {
    durationInterval = setInterval(() => {
      streamDuration.value++
    }, 1000)
  }

  // Start stats monitoring
  const startStatsMonitoring = () => {
    statsInterval = setInterval(async () => {
      if (!peerConnection) return

      try {
        const stats = await peerConnection.getStats()
        let bitrate = 0
        let frameRate = 0
        let resolution = ''

        stats.forEach(report => {
          if (report.type === 'outbound-rtp' && report.kind === 'video') {
            const bytes = report.bytesSent
            const packets = report.packetsSent
            bitrate = Math.round((bytes * 8) / 1000) // kbps
            frameRate = report.framesPerSecond || 0
            resolution = `${report.frameWidth}x${report.frameHeight}`
          }
        })

        streamStats.value = {
          bitrate,
          frameRate,
          resolution,
          bandwidth: bitrate,
          latency: 0
        }
      } catch (err) {
        console.error('Stats error:', err)
      }
    }, 1000)
  }

  // Start viewer count polling
  const startViewerCountPolling = () => {
    viewerCountInterval = setInterval(async () => {
      if (!streamId.value) return

      try {
        const response = await $fetch(`/api/stream/${streamId.value}/viewers`)
        if (response.count !== undefined) {
          viewerCount.value = response.count
        }
      } catch (err) {
        console.error('Viewer count error:', err)
      }
    }, 5000)
  }

  // Change quality
  const changeQuality = async (quality: '1080p' | '720p' | '480p' | '360p') => {
    try {
      if (!peerConnection || !currentConfig.value) {
        throw new Error('Stream not active')
      }

      const preset = qualityPresets[quality]
      const videoTrack = currentConfig.value.mediaStream.getVideoTracks()[0]

      if (videoTrack) {
        await videoTrack.applyConstraints({
          width: { ideal: preset.width },
          height: { ideal: preset.height },
          frameRate: { ideal: preset.frameRate }
        })
      }

      // Update bitrate
      const sender = peerConnection
        .getSenders()
        .find(s => s.track?.kind === 'video')

      if (sender) {
        const params = sender.getParameters()
        if (!params.encodings) {
          params.encodings = [{}]
        }
        params.encodings[0].maxBitrate = preset.bitrate * 1000
        await sender.setParameters(params)
      }

      console.log(`Quality changed to ${quality}`)
    } catch (err: any) {
      error.value = 'Failed to change quality: ' + err.message
      console.error('Quality change error:', err)
    }
  }

  // Pause stream
  const pauseStream = async () => {
    try {
      if (!currentConfig.value) return

      currentConfig.value.mediaStream.getTracks().forEach(track => {
        track.enabled = false
      })

      isLive.value = false
    } catch (err: any) {
      error.value = 'Failed to pause stream: ' + err.message
    }
  }

  // Resume stream
  const resumeStream = async () => {
    try {
      if (!currentConfig.value) return

      currentConfig.value.mediaStream.getTracks().forEach(track => {
        track.enabled = true
      })

      isLive.value = true
    } catch (err: any) {
      error.value = 'Failed to resume stream: ' + err.message
    }
  }

  // Get stream info
  const getStreamInfo = () => {
    return {
      streamId: streamId.value,
      isRecording: isRecording.value,
      isLive: isLive.value,
      duration: streamDuration.value,
      viewers: viewerCount.value,
      stats: streamStats.value,
      config: currentConfig.value
    }
  }

  // Cleanup on unmount
  onUnmounted(async () => {
    if (isRecording.value) {
      await stopStream()
    }
  })

  return {
    // Refs
    isRecording,
    isLive,
    isStopping,
    isConnecting,
    viewerCount,
    streamDuration,
    streamStats,
    error,
    streamId,
    currentConfig,

    // Methods
    startStream,
    stopStream,
    changeQuality,
    pauseStream,
    resumeStream,
    getStreamInfo,
    startRecording,
    uploadRecording
  }
}
