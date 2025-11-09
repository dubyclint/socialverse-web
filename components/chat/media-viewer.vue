<!-- components/chat/MediaViewer.vue -->
<template>
  <div class="media-viewer-overlay" v-if="show" @click="handleOverlayClick">
    <div class="media-viewer" @click.stop>
      <!-- Header -->
      <div class="viewer-header">
        <div class="media-info">
          <div class="sender-info">
            <img :src="media.sender?.avatar || '/default-avatar.png'" :alt="media.sender?.username" />
            <div class="sender-details">
              <div class="sender-name">{{ media.sender?.username }}</div>
              <div class="media-date">{{ formatDate(media.createdAt) }}</div>
            </div>
          </div>
        </div>
        
        <div class="viewer-actions">
          <button class="action-btn" @click="downloadMedia" v-if="media.mediaUrl">
            <Icon name="download" />
          </button>
          <button class="action-btn" @click="shareMedia" v-if="canShare">
            <Icon name="share" />
          </button>
          <button class="action-btn" @click="$emit('close')">
            <Icon name="x" />
          </button>
        </div>
      </div>

      <!-- Media Content -->
      <div class="media-content">
        <!-- Image -->
        <div v-if="media.messageType === 'image'" class="image-viewer">
          <img 
            :src="media.mediaUrl" 
            :alt="media.content || 'Image'"
            @load="handleImageLoad"
            @error="handleImageError"
          />
          <div class="image-controls">
            <button class="zoom-btn" @click="zoomIn">
              <Icon name="zoom-in" />
            </button>
            <button class="zoom-btn" @click="zoomOut">
              <Icon name="zoom-out" />
            </button>
            <button class="zoom-btn" @click="resetZoom">
              <Icon name="maximize" />
            </button>
          </div>
        </div>

        <!-- Video -->
        <div v-else-if="media.messageType === 'video'" class="video-viewer">
          <video 
            ref="videoPlayer"
            :src="media.mediaUrl"
            controls
            preload="metadata"
            @loadedmetadata="handleVideoLoad"
            @error="handleVideoError"
          >
            Your browser does not support video playback.
          </video>
        </div>

        <!-- Audio -->
        <div v-else-if="media.messageType === 'audio'" class="audio-viewer">
          <div class="audio-player">
            <div class="audio-artwork">
              <Icon name="music" />
            </div>
            <div class="audio-controls">
              <button class="play-btn" @click="toggleAudioPlayback">
                <Icon :name="isAudioPlaying ? 'pause' : 'play'" />
              </button>
              <div class="audio-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: audioProgress + '%' }"></div>
                </div>
                <div class="time-display">
                  {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                </div>
              </div>
              <div class="volume-control">
                <Icon name="volume-2" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  v-model="volume"
                  @input="updateVolume"
                  class="volume-slider"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Document -->
        <div v-else-if="media.messageType === 'file'" class="document-viewer">
          <div class="document-preview">
            <div class="document-icon">
              <Icon :name="getFileIcon(media.mediaMetadata?.mimeType)" />
            </div>
            <div class="document-info">
              <div class="document-name">{{ media.mediaMetadata?.originalName || 'Document' }}</div>
              <div class="document-size">{{ formatFileSize(media.mediaMetadata?.size) }}</div>
              <div class="document-type">{{ media.mediaMetadata?.mimeType }}</div>
            </div>
          </div>
          
          <div class="document-actions">
            <button class="primary-btn" @click="downloadMedia">
              <Icon name="download" />
              Download
            </button>
            <button class="secondary-btn" @click="openInNewTab" v-if="canPreview">
              <Icon name="external-link" />
              Open
            </button>
          </div>
        </div>
      </div>

      <!-- Caption -->
      <div class="media-caption" v-if="media.content">
        <p>{{ media.content }}</p>
      </div>

      <!-- Navigation -->
      <div class="media-navigation" v-if="mediaList.length > 1">
        <button 
          class="nav-btn prev-btn" 
          @click="previousMedia"
          :disabled="currentIndex === 0"
        >
          <Icon name="chevron-left" />
        </button>
        <div class="media-counter">
          {{ currentIndex + 1 }} of {{ mediaList.length }}
        </div>
        <button 
          class="nav-btn next-btn" 
          @click="nextMedia"
          :disabled="currentIndex === mediaList.length - 1"
        >
          <Icon name="chevron-right" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import Icon from '@/components/ui/Icon.vue'

// Props
const props = defineProps({
  show: Boolean,
  media: Object,
  mediaList: { type: Array, default: () => [] },
  currentIndex: { type: Number, default: 0 }
})

// Emits
const emit = defineEmits(['close', 'navigate'])

// Reactive data
const isAudioPlaying = ref(false)
const audioProgress = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const zoomLevel = ref(1)

// Refs
const videoPlayer = ref(null)
let audioElement = null

// Computed
const canShare = computed(() => {
  return navigator.share && props.media?.mediaUrl
})

const canPreview = computed(() => {
  const previewableTypes = ['application/pdf', 'text/plain']
  return previewableTypes.includes(props.media?.mediaMetadata?.mimeType)
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const formatDate = (timestamp) => {
  return format(new Date(timestamp), 'MMM d, yyyy at h:mm a')
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'file'
  
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('word')) return 'file-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-spreadsheet'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive'
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('video')) return 'video'
  if (mimeType.includes('audio')) return 'music'
  
  return 'file'
}

const downloadMedia = () => {
  if (props.media?.mediaUrl) {
    const link = document.createElement('a')
    link.href = props.media.mediaUrl
    link.download = props.media.mediaMetadata?.originalName || 'file'
    link.click()
  }
}

const shareMedia = async () => {
  if (navigator.share && props.media?.mediaUrl) {
    try {
      await navigator.share({
        title: 'Shared from SocialVerse',
        text: props.media.content || 'Check out this media',
        url: props.media.mediaUrl
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }
}

const openInNewTab = () => {
  if (props.media?.mediaUrl) {
    window.open(props.media.mediaUrl, '_blank')
  }
}

const handleImageLoad = () => {
  console.log('Image loaded')
}

const handleImageError = () => {
  console.error('Image failed to load')
}

const handleVideoLoad = () => {
  console.log('Video loaded')
}

const handleVideoError = () => {
  console.error('Video failed to load')
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.5)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const toggleAudioPlayback = () => {
  if (!audioElement && props.media?.mediaUrl) {
    audioElement = new Audio(props.media.mediaUrl)
    audioElement.addEventListener('timeupdate', updateAudioProgress)
    audioElement.addEventListener('loadedmetadata', () => {
      duration.value = audioElement.duration
    })
    audioElement.addEventListener('ended', () => {
      isAudioPlaying.value = false
      audioProgress.value = 0
      currentTime.value = 0
    })
  }

  if (audioElement) {
    if (isAudioPlaying.value) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    isAudioPlaying.value = !isAudioPlaying.value
  }
}

const updateAudioProgress = () => {
  if (audioElement) {
    currentTime.value = audioElement.currentTime
    audioProgress.value = (audioElement.currentTime / audioElement.duration) * 100
  }
}

const updateVolume = () => {
  if (audioElement) {
    audioElement.volume = volume.value / 100
  }
}

const previousMedia = () => {
  if (props.currentIndex > 0) {
    emit('navigate', props.currentIndex - 1)
  }
}

const nextMedia = () => {
  if (props.currentIndex < props.mediaList.length - 1) {
    emit('navigate', props.currentIndex + 1)
  }
}

const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      previousMedia()
      break
    case 'ArrowRight':
      nextMedia()
      break
    case ' ':
      if (props.media?.messageType === 'video' && videoPlayer.value) {
        event.preventDefault()
        if (videoPlayer.value.paused) {
          videoPlayer.value.play()
        } else {
          videoPlayer.value.pause()
        }
      }
      break
  }
}

// Watchers
watch(() => props.media, () => {
  // Reset audio when media changes
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
  isAudioPlaying.value = false
  audioProgress.value = 0
  currentTime.value = 0
  duration.value = 0
  zoomLevel.value = 1
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
})
</script>

<style scoped>
.media-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.media-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: white;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-info img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.sender-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.media-date {
  font-size: 12px;
  opacity: 0.7;
}

.viewer-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.media-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.image-viewer {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.image-viewer img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(v-bind(zoomLevel));
  transition: transform 0.2s;
}

.image-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
}

.zoom-btn {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: white;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.zoom-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.video-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-viewer video {
  max-width: 100%;
  max-height: 100%;
  outline: none;
}

.audio-viewer {
  width: 100%;
  max-width: 500px;
  padding: 40px;
}

.audio-player {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
}

.audio-artwork {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 48px;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.play-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #1976d2;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 24px;
  transition: background-color 0.2s;
}

.play-btn:hover {
  background: #1565c0;
}

.audio-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1976d2;
  transition: width 0.1s;
}

.time-display {
  font-size: 14px;
  text-align: center;
  opacity: 0.8;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.volume-slider {
  width: 100px;
}

.document-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  padding: 40px;
  max-width: 400px;
}

.document-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.document-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.document-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.document-size,
.document-type {
  font-size: 14px;
  opacity: 0.7;
}

.document-actions {
  display: flex;
  gap: 12px;
}

.primary-btn,
.secondary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.primary-btn {
  background: #1976d2;
  color: white;
  border: none;
}

.primary-btn:hover {
  background: #1565c0;
}

.secondary-btn {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.media-caption {
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  text-align: center;
}

.media-caption p {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.media-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
}

.nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.media-counter {
  font-size: 14px;
  opacity: 0.8;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .viewer-header {
    padding: 16px;
  }
  
  .sender-info img {
    width: 32px;
    height: 32px;
  }
  
  .sender-name {
    font-size: 14px;
  }
  
  .media-date {
    font-size: 11px;
  }
  
  .audio-viewer {
    padding: 20px;
  }
  
  .audio-player {
    padding: 20px;
  }
  
  .audio-artwork {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }
  
  .document-viewer {
    padding: 20px;
  }
  
  .document-icon {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
  
  .document-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .primary-btn,
  .secondary-btn {
    justify-content: center;
  }
}
</style>
