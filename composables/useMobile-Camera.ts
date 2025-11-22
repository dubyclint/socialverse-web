// FILE 1: composables/useMobileCamera.ts - COMPLETE PRODUCTION-READY COMPOSABLE
// ============================================================================
// MOBILE CAMERA COMPOSABLE - HANDLES ALL CAMERA OPERATIONS
// ============================================================================

import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export interface CameraConstraints {
  audio: boolean | MediaTrackConstraints
  video: boolean | MediaTrackConstraints
}

export const useMobileCamera = () => {
  const cameraPreview: Ref<HTMLVideoElement | null> = ref(null)
  const mediaStream: Ref<MediaStream | null> = ref(null)
  const isConnecting = ref(false)
  const isCameraInitialized = ref(false)
  const hasFlash = ref(false)
  const flashOn = ref(false)
  const isMicMuted = ref(false)
  const isCameraOff = ref(false)
  const canSwitchCamera = ref(false)
  const currentFacingMode: Ref<'user' | 'environment'> = ref('user')
  const error: Ref<string | null> = ref(null)

  // Check device capabilities
  const checkDeviceCapabilities = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      canSwitchCamera.value = videoDevices.length > 1

      // Check for flash support
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      const videoTrack = stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities?.()
      hasFlash.value = capabilities?.torch ? true : false
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      console.warn('Could not check device capabilities:', err)
    }
  }

  // Initialize camera
  const initializeCamera = async (facingMode: 'user' | 'environment' = 'user') => {
    if (isCameraInitialized.value && mediaStream.value) {
      return mediaStream.value
    }

    isConnecting.value = true
    error.value = null

    try {
      // Check permissions first
      const permissionStatus = await navigator.permissions.query({ name: 'camera' })
      if (permissionStatus.state === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in settings.')
      }

      const constraints: CameraConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStream.value = stream
      currentFacingMode.value = facingMode

      // Attach to video element
      if (cameraPreview.value) {
        cameraPreview.value.srcObject = stream
        await cameraPreview.value.play()
      }

      isCameraInitialized.value = true
      isCameraOff.value = false

      // Check device capabilities
      await checkDeviceCapabilities()

      return stream
    } catch (err: any) {
      error.value = err.message || 'Failed to initialize camera'
      console.error('Camera initialization error:', err)
      throw err
    } finally {
      isConnecting.value = false
    }
  }

  // Stop camera
  const stopCamera = async () => {
    try {
      if (mediaStream.value) {
        mediaStream.value.getTracks().forEach(track => {
          track.stop()
        })
        mediaStream.value = null
      }

      if (cameraPreview.value) {
        cameraPreview.value.srcObject = null
      }

      isCameraInitialized.value = false
      isCameraOff.value = false
      flashOn.value = false
    } catch (err) {
      console.error('Error stopping camera:', err)
    }
  }

  // Switch between front and back camera
  const switchCamera = async () => {
    if (!canSwitchCamera.value) {
      error.value = 'Device does not support camera switching'
      return
    }

    try {
      const newFacingMode = currentFacingMode.value === 'user' ? 'environment' : 'user'
      
      // Stop current stream
      if (mediaStream.value) {
        mediaStream.value.getTracks().forEach(track => track.stop())
      }

      // Initialize with new facing mode
      await initializeCamera(newFacingMode)
    } catch (err: any) {
      error.value = 'Failed to switch camera: ' + err.message
      console.error('Camera switch error:', err)
    }
  }

  // Toggle flash
  const toggleFlash = async () => {
    if (!hasFlash.value) {
      error.value = 'Flash not supported on this device'
      return
    }

    try {
      const videoTrack = mediaStream.value?.getVideoTracks()[0]
      if (!videoTrack) {
        throw new Error('No video track available')
      }

      const capabilities = videoTrack.getCapabilities?.()
      if (!capabilities?.torch) {
        throw new Error('Torch not supported')
      }

      const settings = videoTrack.getSettings?.()
      const currentTorch = settings?.torch || false

      await videoTrack.applyConstraints({
        advanced: [{ torch: !currentTorch }]
      })

      flashOn.value = !currentTorch
    } catch (err: any) {
      error.value = 'Failed to toggle flash: ' + err.message
      console.error('Flash toggle error:', err)
    }
  }

  // Toggle microphone
  const toggleMicrophone = async () => {
    try {
      const audioTracks = mediaStream.value?.getAudioTracks()
      if (!audioTracks || audioTracks.length === 0) {
        throw new Error('No audio track available')
      }

      const isCurrentlyMuted = !audioTracks[0].enabled
      audioTracks.forEach(track => {
        track.enabled = isCurrentlyMuted
      })

      isMicMuted.value = !isCurrentlyMuted
    } catch (err: any) {
      error.value = 'Failed to toggle microphone: ' + err.message
      console.error('Microphone toggle error:', err)
    }
  }

  // Toggle camera on/off
  const toggleCamera = async () => {
    try {
      const videoTracks = mediaStream.value?.getVideoTracks()
      if (!videoTracks || videoTracks.length === 0) {
        throw new Error('No video track available')
      }

      const isCurrentlyOff = !videoTracks[0].enabled
      videoTracks.forEach(track => {
        track.enabled = isCurrentlyOff
      })

      isCameraOff.value = !isCurrentlyOff
    } catch (err: any) {
      error.value = 'Failed to toggle camera: ' + err.message
      console.error('Camera toggle error:', err)
    }
  }

  // Get camera resolution
  const getCameraResolution = () => {
    const videoTrack = mediaStream.value?.getVideoTracks()[0]
    if (!videoTrack) return null

    const settings = videoTrack.getSettings?.()
    return {
      width: settings?.width,
      height: settings?.height,
      frameRate: settings?.frameRate
    }
  }

  // Get camera constraints
  const getCameraConstraints = () => {
    const videoTrack = mediaStream.value?.getVideoTracks()[0]
    if (!videoTrack) return null

    return videoTrack.getConstraints?.()
  }

  // Apply camera constraints
  const applyCameraConstraints = async (constraints: MediaTrackConstraints) => {
    try {
      const videoTrack = mediaStream.value?.getVideoTracks()[0]
      if (!videoTrack) {
        throw new Error('No video track available')
      }

      await videoTrack.applyConstraints(constraints)
    } catch (err: any) {
      error.value = 'Failed to apply constraints: ' + err.message
      console.error('Apply constraints error:', err)
      throw err
    }
  }

  // Get device info
  const getDeviceInfo = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return {
        cameras: devices.filter(d => d.kind === 'videoinput'),
        microphones: devices.filter(d => d.kind === 'audioinput'),
        speakers: devices.filter(d => d.kind === 'audiooutput')
      }
    } catch (err) {
      console.error('Error getting device info:', err)
      return null
    }
  }

  // Check permissions
  const checkPermissions = async () => {
    try {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' })
      const micStatus = await navigator.permissions.query({ name: 'microphone' })

      return {
        camera: cameraStatus.state,
        microphone: micStatus.state
      }
    } catch (err) {
      console.error('Error checking permissions:', err)
      return null
    }
  }

  // Cleanup on unmount
  onUnmounted(async () => {
    await stopCamera()
  })

  return {
    // Refs
    cameraPreview,
    mediaStream,
    isConnecting,
    isCameraInitialized,
    hasFlash,
    flashOn,
    isMicMuted,
    isCameraOff,
    canSwitchCamera,
    currentFacingMode,
    error,

    // Methods
    initializeCamera,
    stopCamera,
    switchCamera,
    toggleFlash,
    toggleMicrophone,
    toggleCamera,
    getCameraResolution,
    getCameraConstraints,
    applyCameraConstraints,
    getDeviceInfo,
    checkPermissions
  }
}
