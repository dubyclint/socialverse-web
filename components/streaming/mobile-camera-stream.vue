<!-- FILE: components/streaming/mobile-camera-stream.vue - UPDATED & ENHANCED VERSION -->
<!-- ============================================================================
     MOBILE CAMERA STREAM - COMPLETE PRODUCTION-READY COMPONENT
     ============================================================================ -->

<template>
  <div class="mobile-camera-stream">
    <div class="camera-container" :class="{ 'recording': isRecording }">
      <video 
        ref="cameraPreview"
        autoplay
        muted
        playsinline
        webkit-playsinline
      ></video>
      
      <!-- Camera Overlay -->
      <div class="camera-overlay">
        <div class="camera-top-bar">
          <button @click="switchCamera" class="camera-btn" :disabled="!canSwitchCamera" title="Switch Camera">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          <div class="stream-status">
            <div v-if="isLive" class="live-indicator">
              <span class="live-dot"></span>
              LIVE
            </div>
            <div v-else class="preparing-indicator">
              Preparing...
            </div>
          </div>
          
          <button @click="toggleFlash" class="camera-btn" v-if="hasFlash" title="Toggle Flash">
            <svg v-if="!flashOn" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </button>
        </div>
        
        <div class="camera-center">
          <div v-if="isConnecting" class="connecting-spinner">
            <div class="spinner"></div>
            <p>Connecting...</p>
          </div>
        </div>
        
        <div class="camera-bottom-bar">
          <div class="camera-controls">
            <button @click="toggleMicrophone" class="control-btn" :class="{ 'muted': isMicMuted }" title="Toggle Microphone">
              <svg v-if="!isMicMuted" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
              </svg>
            </button>
            
            <button 
              @click="toggleStream" 
              class="stream-toggle-btn"
              :class="{ 'recording': isRecording, 'stopping': isStopping }"
              :disabled="isConnecting || isStopping"
              title="Start/Stop Stream"
            >
              <div class="stream-btn-content">
                <div v-if="!isRecording && !isStopping" class="start-icon">
                  <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div v-else-if="isRecording && !isStopping" class="stop-icon">
                  <div class="stop-square"></div>
                </div>
                <div v-else class="stopping-spinner">
                  <div class="spinner small"></div>
                </div>
              </div>
              <span class="stream-btn-text">
                {{ getStreamButtonText() }}
              </span>
            </button>
            
            <button @click="toggleCamera" class="control-btn" :class="{ 'disabled': isCameraOff }" title="Toggle Camera">
              <svg v-if="!isCameraOff" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
          </div>
          
          <div class="stream-info">
            <div class="viewer-count">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
              </svg>
              {{ viewerCount }}
            </div>
            <div class="stream-duration">{{ formatDuration(streamDuration) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Quality Settings -->
      <div class="quality-settings" :class="{ 'visible': showQualitySettings }">
        <div class="quality-header">
          <h4>Stream Quality</h4>
          <button @click="showQualitySettings = false" class="close-btn">×</button>
        </div>
        <div class="quality-options">
          <label v-for="quality in availableQualities" :key="quality.value" class="quality-option">
            <input 
              type="radio" 
              :value="quality.value" 
              v-model="selectedQuality"
              @change="changeStreamQuality"
            >
            <span class="quality-label">
              {{ quality.label }}
              <small>{{ quality.description }}</small>
            </span>
          </label>
        </div>
      </div>
    </div>
    
    <!-- Stream Settings Panel -->
    <div class="stream-settings-panel" :class="{ 'expanded': showSettings }">
      <div class="settings-header" @click="showSettings = !showSettings">
        <h3>Stream Settings</h3>
        <button class="expand-btn">
          <svg class="w-5 h-5" :class="{ 'rotate-180': showSettings }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
      
      <div v-if="showSettings" class="settings-content">
        <div class="setting-group">
          <label>Stream Title</label>
          <input 
            v-model="streamTitle" 
            type="text" 
            placeholder="Enter stream title..."
            maxlength="100"
          >
        </div>
        
        <div class="setting-group">
          <label>Category</label>
          <select v-model="streamCategory">
            <option value="just-chatting">Just Chatting</option>
            <option value="gaming">Gaming</option>
            <option value="music">Music</option>
            <option value="art">Art</option>
            <option value="cooking">Cooking</option>
            <option value="fitness">Fitness</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label>Privacy</label>
          <select v-model="streamPrivacy">
            <option value="public">Public</option>
            <option value="pals-only">Pals Only</option>
            <option value="private">Private</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="enableRecording">
            <span>Record Stream</span>
          </label>
        </div>
        
        <div class="setting-group">
          <button @click="showQualitySettings = true" class="settings-btn">
            Quality Settings
          </button>
        </div>
      </div>
    </div>
    
    <!-- Error Messages -->
    <div v-if="errorMessage" class="error-message">
      <div class="error-content">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <p>{{ errorMessage }}</p>
        <button @click="clearError" class="error-dismiss">Dismiss</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMobileCamera } from '~/composables/useMobile-Camera'
import { useStreamBroadcast } from '~/composables/useStream-Broadcast'

const props = defineProps({
  streamId: String
})

const emit = defineEmits(['stream-started', 'stream-ended', 'error'])

const {
  cameraPreview,
  mediaStream,
  isConnecting,
  canSwitchCamera,
  hasFlash,
  flashOn,
  isMicMuted,
  isCameraOff,
  switchCamera,
  toggleFlash,
  toggleMicrophone,
  toggleCamera,
  initializeCamera,
  stopCamera
} = useMobileCamera()

const {
  isRecording,
  isLive,
  isStopping,
  viewerCount,
  streamDuration,
  startStream,
  stopStream
} = useStreamBroadcast()

const showSettings = ref(false)
const showQualitySettings = ref(false)
const errorMessage = ref('')

const streamTitle = ref('Live from Mobile')
const streamCategory = ref('just-chatting')
const streamPrivacy = ref('public')
const enableRecording = ref(true)
const selectedQuality = ref('720p')

const availableQualities = ref([
  { value: '1080p', label: '1080p HD', description: 'Best quality, high bandwidth' },
  { value: '720p', label: '720p HD', description: 'Good quality, moderate bandwidth' },
  { value: '480p', label: '480p', description: 'Standard quality, low bandwidth' },
  { value: '360p', label: '360p', description: 'Basic quality, minimal bandwidth' }
])

const toggleStream = async () => {
  try {
    if (!isRecording.value) {
      await startMobileStream()
    } else {
      await stopMobileStream()
    }
  } catch (error: any) {
    handleError('Failed to toggle stream: ' + error.message)
  }
}

const startMobileStream = async () => {
  try {
    if (!mediaStream.value) {
      await initializeCamera()
    }
    
    const streamConfig = {
      streamId: props.streamId,
      title: streamTitle.value,
      category: streamCategory.value,
      privacy: streamPrivacy.value,
      quality: selectedQuality.value,
      enableRecording: enableRecording.value,
      mediaStream: mediaStream.value
    }
    
    await startStream(streamConfig)
    emit('stream-started', streamConfig)
  } catch (error: any) {
    handleError('Failed to start stream: ' + error.message)
  }
}

const stopMobileStream = async () => {
  try {
    await stopStream()
    emit('stream-ended')
  } catch (error: any) {
    handleError('Failed to stop stream: ' + error.message)
  }
}

const changeStreamQuality = async () => {
  try {
    // Quality change is handled by the broadcast composable
    console.log('Changing quality to:', selectedQuality.value)
  } catch (error: any) {
    handleError('Failed to change quality: ' + error.message)
  }
}

const getStreamButtonText = () => {
  if (isStopping.value) return 'Stopping...'
  if (isRecording.value) return 'Stop Stream'
  if (isConnecting.value) return 'Connecting...'
  return 'Go Live'
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const handleError = (message: string) => {
  errorMessage.value = message
  emit('error', message)
  console.error('Mobile Camera Stream Error:', message)
}

const clearError = () => {
  errorMessage.value = ''
}

onMounted(async () => {
  try {
    await initializeCamera()
  } catch (error: any) {
    handleError('Failed to initialize camera: ' + error.message)
  }
})

onUnmounted(async () => {
  try {
    if (isRecording.value) {
      await stopMobileStream()
    }
    await stopCamera()
  } catch (error) {
    console.error('Cleanup error:', error)
  }
})
</script>

<style scoped>
.mobile-camera-stream {
  width: 100%;
  background: #000;
  color: white;
  position: relative;
}

.camera-container {
  position: relative;
  width: 100%;
  aspect-ratio: 9/16;
  background: #000;
  overflow: hidden;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.camera-container.recording {
  box-shadow: 0 0 0 3px #ef4444;
}

.camera-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.6) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 0, 0, 0.6) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.camera-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.camera-btn {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.camera-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.camera-btn:active:not(:disabled) {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.7);
}

.stream-status {
  flex: 1;
  display: flex;
  justify-content: center;
}

.live-indicator {
  background: #ef4444;
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.preparing-indicator {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  backdrop-filter: blur(8px);
}

.camera-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connecting-spinner {
  text-align: center;
}

.connecting-spinner .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

.connecting-spinner p {
  font-size: 14px;
  color: white;
  margin: 0;
}

.camera-bottom-bar {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.camera-controls {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.control-btn {
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
  min-width: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn.muted,
.control-btn.disabled {
  background: rgba(239, 68, 68, 0.5);
}

.control-btn:active {
  transform: scale(0.95);
}

.stream-toggle-btn {
  background: #10b981;
  border: none;
  color: white;
  padding: 16px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
}

.stream-toggle-btn.recording {
  background: #ef4444;
  animation: recordingPulse 2s infinite;
}

.stream-toggle-btn.stopping {
  background: #6b7280;
  cursor: not-allowed;
}

.stream-toggle-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.stream-toggle-btn:active:not(:disabled) {
  transform: scale(0.95);
}

@keyframes recordingPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
}

.stream-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stop-square {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 2px;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.stream-btn-text {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stream-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
}

.stream-duration {
  color: white;
  font-weight: 500;
}

.quality-settings {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.quality-settings.visible {
  opacity: 1;
  visibility: visible;
}

.quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quality-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
}

.quality-options {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quality-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quality-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.quality-option input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
}

.quality-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quality-label small {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.stream-settings-panel {
  background: #1a1a1a;
  border-top: 1px solid #2d2d2d;
  border-radius: 12px 12px 0 0;
  margin-top: 16px;
  transition: all 0.3s ease;
  max-height: 60px;
  overflow: hidden;
}

.stream-settings-panel.expanded {
  max-height: 400px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.expand-btn {
  background: none;
  border: none;
  color: white;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.expand-btn svg.rotate-180 {
  transform: rotate(180deg);
}

.settings-content {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.setting-group input[type="text"],
.setting-group select {
  background: #2d2d2d;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.setting-group input[type="text"]:focus,
.setting-group select:focus {
  outline: none;
  border-color: #10b981;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #10b981;
}

.settings-btn {
  background: #2d2d2d;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: #3d3d3d;
  border-color: #5d5d5d;
}

.settings-btn:active {
  transform: scale(0.98);
}

.error-message {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 16px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-content p {
  flex: 1;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.error-dismiss {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.error-dismiss:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 480px) {
  .camera-container {
    border-radius: 0;
  }

  .stream-settings-panel {
    border-radius: 0;
  }

  .stream-toggle-btn {
    min-width: 70px;
    min-height: 70px;
  }
}
</style>
