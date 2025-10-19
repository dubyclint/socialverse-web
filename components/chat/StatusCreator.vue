<!-- components/chat/StatusCreator.vue -->
<template>
  <div class="status-creator-overlay" @click="handleOverlayClick">
    <div class="status-creator" @click.stop>
      <div class="creator-header">
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
        <h3>Create Status</h3>
        <button 
          class="post-btn" 
          @click="createStatus"
          :disabled="!canPost || isPosting"
        >
          {{ isPosting ? 'Posting...' : 'Post' }}
        </button>
      </div>

      <div class="creator-content">
        <!-- Status Type Selector -->
        <div class="status-types">
          <button 
            v-for="type in statusTypes"
            :key="type.id"
            class="type-btn"
            :class="{ active: selectedType === type.id }"
            @click="selectedType = type.id"
          >
            <Icon :name="type.icon" />
            <span>{{ type.label }}</span>
          </button>
        </div>

        <!-- Text Status -->
        <div v-if="selectedType === 'text'" class="text-status">
          <div class="text-input-container" :style="{ backgroundColor: selectedColor.background }">
            <textarea
              v-model="statusText"
              placeholder="What's on your mind?"
              class="status-textarea"
              :style="{ color: selectedColor.text }"
              maxlength="500"
              @input="adjustTextareaHeight"
              ref="textareaRef"
            ></textarea>
          </div>
          
          <!-- Color Palette -->
          <div class="color-palette">
            <div class="palette-label">Background Color</div>
            <div class="color-options">
              <button
                v-for="color in colorPalette"
                :key="color.background"
                class="color-option"
                :class="{ active: selectedColor.background === color.background }"
                :style="{ backgroundColor: color.background }"
                @click="selectedColor = color"
              >
                <Icon name="check" v-if="selectedColor.background === color.background" />
              </button>
            </div>
          </div>
        </div>

        <!-- Image Status -->
        <div v-if="selectedType === 'image'" class="image-status">
          <div class="image-upload-area" @click="selectImage" @drop="handleImageDrop" @dragover.prevent>
            <div v-if="!selectedImage" class="upload-placeholder">
              <Icon name="image" />
              <p>Click to select an image or drag & drop</p>
              <small>Max size: 10MB</small>
            </div>
            <div v-else class="image-preview">
              <img :src="imagePreview" alt="Status image" />
              <button class="remove-image" @click="removeImage">
                <Icon name="x" />
              </button>
            </div>
          </div>
          
          <div class="image-caption">
            <input
              v-model="statusText"
              placeholder="Add a caption..."
              class="caption-input"
              maxlength="200"
            />
          </div>
        </div>

        <!-- Video Status -->
        <div v-if="selectedType === 'video'" class="video-status">
          <div class="video-upload-area" @click="selectVideo">
            <div v-if="!selectedVideo" class="upload-placeholder">
              <Icon name="video" />
              <p>Click to select a video</p>
              <small>Max duration: 10 seconds, Max size: 50MB</small>
            </div>
            <div v-else class="video-preview">
              <video :src="videoPreview" controls muted></video>
              <button class="remove-video" @click="removeVideo">
                <Icon name="x" />
              </button>
            </div>
          </div>
          
          <div class="video-caption">
            <input
              v-model="statusText"
              placeholder="Add a caption..."
              class="caption-input"
              maxlength="200"
            />
          </div>
        </div>

        <!-- Audio Status -->
        <div v-if="selectedType === 'audio'" class="audio-status">
          <div class="audio-recorder" v-if="!selectedAudio">
            <div class="recorder-controls">
              <button 
                class="record-btn"
                :class="{ recording: isRecording }"
                @mousedown="startRecording"
                @mouseup="stopRecording"
                @touchstart="startRecording"
                @touchend="stopRecording"
              >
                <Icon name="mic" />
              </button>
              <div class="recording-info">
                <p v-if="!isRecording">Hold to record audio</p>
                <p v-else>Recording... {{ recordingDuration }}s</p>
              </div>
            </div>
            
            <div class="upload-option">
              <button class="upload-audio-btn" @click="selectAudio">
                <Icon name="upload" />
                Upload Audio File
              </button>
            </div>
          </div>
          
          <div v-else class="audio-preview">
            <div class="audio-player">
              <button class="play-btn" @click="toggleAudioPlayback">
                <Icon :name="isAudioPlaying ? 'pause' : 'play'" />
              </button>
              <div class="audio-waveform">
                <div class="waveform-bars">
                  <div 
                    v-for="(bar, index) in audioWaveform" 
                    :key="index"
                    class="waveform-bar"
                    :style="{ height: bar + '%' }"
                  ></div>
                </div>
              </div>
              <div class="audio-duration">{{ formatDuration(audioDuration) }}</div>
            </div>
            <button class="remove-audio" @click="removeAudio">
              <Icon name="trash-2" />
              Remove
            </button>
          </div>
        </div>

        <!-- Status Preview -->
        <div class="status-preview">
          <div class="preview-label">Preview</div>
          <div class="preview-container">
            <div class="status-preview-item">
              <div class="preview-avatar">
                <img :src="currentUser.avatar || '/default-avatar.png'" :alt="currentUser.username" />
              </div>
              <div class="preview-content">
                <div class="preview-name">{{ currentUser.username }}</div>
                <div class="preview-time">now</div>
                <div 
                  class="preview-status"
                  :style="selectedType === 'text' ? { 
                    backgroundColor: selectedColor.background,
                    color: selectedColor.text 
                  } : {}"
                >
                  <div v-if="selectedType === 'text'" class="preview-text">
                    {{ statusText || 'What\'s on your mind?' }}
                  </div>
                  <div v-else-if="selectedType === 'image'" class="preview-image">
                    <img v-if="imagePreview" :src="imagePreview" alt="Preview" />
                    <div v-else class="preview-placeholder">📷 Image</div>
                    <div v-if="statusText" class="preview-caption">{{ statusText }}</div>
                  </div>
                  <div v-else-if="selectedType === 'video'" class="preview-video">
                    <video v-if="videoPreview" :src="videoPreview" muted></video>
                    <div v-else class="preview-placeholder">🎥 Video</div>
                    <div v-if="statusText" class="preview-caption">{{ statusText }}</div>
                  </div>
                  <div v-else-if="selectedType === 'audio'" class="preview-audio">
                    <div class="preview-placeholder">🎵 Audio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hidden file inputs -->
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        @change="handleImageSelect"
        style="display: none"
      />
      <input
        ref="videoInput"
        type="file"
        accept="video/*"
        @change="handleVideoSelect"
        style="display: none"
      />
      <input
        ref="audioInput"
        type="file"
        accept="audio/*"
        @change="handleAudioSelect"
        style="display: none"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useChatStore } from '@/stores/chatStore'
import Icon from '@/components/ui/Icon.vue'

// Emits
const emit = defineEmits(['close', 'created'])

// Stores
const userStore = useUserStore()
const chatStore = useChatStore()

// Reactive data
const selectedType = ref('text')
const statusText = ref('')
const selectedColor = ref({ background: '#1976d2', text: '#ffffff' })
const selectedImage = ref(null)
const selectedVideo = ref(null)
const selectedAudio = ref(null)
const imagePreview = ref('')
const videoPreview = ref('')
const audioPreview = ref('')
const isRecording = ref(false)
const recordingDuration = ref(0)
const isAudioPlaying = ref(false)
const audioDuration = ref(0)
const isPosting = ref(false)

// Refs
const textareaRef = ref(null)
const imageInput = ref(null)
const videoInput = ref(null)
const audioInput = ref(null)

// Recording variables
let mediaRecorder = null
let recordingInterval = null
let audioElement = null

// Computed properties
const currentUser = computed(() => userStore.user)

const statusTypes = computed(() => [
  { id: 'text', label: 'Text', icon: 'type' },
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'audio', label: 'Audio', icon: 'mic' }
])

const colorPalette = computed(() => [
  { background: '#1976d2', text: '#ffffff' },
  { background: '#f44336', text: '#ffffff' },
  { background: '#4caf50', text: '#ffffff' },
  { background: '#ff9800', text: '#ffffff' },
  { background: '#9c27b0', text: '#ffffff' },
  { background: '#00bcd4', text: '#ffffff' },
  { background: '#795548', text: '#ffffff' },
  { background: '#607d8b', text: '#ffffff' },
  { background: '#000000', text: '#ffffff' },
  { background: '#ffffff', text: '#000000' },
  { background: '#ffeb3b', text: '#000000' },
  { background: '#e91e63', text: '#ffffff' }
])

const audioWaveform = computed(() => {
  // Generate random waveform for demo
  return Array.from({ length: 20 }, () => Math.random() * 100)
})

const canPost = computed(() => {
  switch (selectedType.value) {
    case 'text':
      return statusText.value.trim().length > 0
    case 'image':
      return selectedImage.value !== null
    case 'video':
      return selectedVideo.value !== null
    case 'audio':
      return selectedAudio.value !== null
    default:
      return false
  }
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const adjustTextareaHeight = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 200) + 'px'
    }
  })
}

const selectImage = () => {
  imageInput.value?.click()
}

const selectVideo = () => {
  videoInput.value?.click()
}

const selectAudio = () => {
  audioInput.value?.click()
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB')
      return
    }
    
    selectedImage.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const handleVideoSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('Video size must be less than 50MB')
      return
    }
    
    // Check duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      if (video.duration > 10) { // 10 seconds limit
        alert('Video duration must be 10 seconds or less')
        return
      }
      
      selectedVideo.value = file
      videoPreview.value = URL.createObjectURL(file)
    }
    video.src = URL.createObjectURL(file)
  }
}

const handleAudioSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Audio size must be less than 10MB')
      return
    }
    
    // Check duration
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      if (audio.duration > 30) { // 30 seconds limit
        alert('Audio duration must be 30 seconds or less')
        return
      }
      
      selectedAudio.value = file
      audioPreview.value = URL.createObjectURL(file)
      audioDuration.value = Math.round(audio.duration)
    }
    audio.src = URL.createObjectURL(file)
  }
}

const handleImageDrop = (event) => {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    handleImageSelect({ target: { files: [file] } })
  }
}

const removeImage = () => {
  selectedImage.value = null
  imagePreview.value = ''
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const removeVideo = () => {
  selectedVideo.value = null
  videoPreview.value = ''
  if (videoInput.value) {
    videoInput.value.value = ''
  }
}

const removeAudio = () => {
  selectedAudio.value = null
  audioPreview.value = ''
  audioDuration.value = 0
  if (audioInput.value) {
    audioInput.value.value = ''
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    
    const audioChunks = []
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      selectedAudio.value = audioBlob
      audioPreview.value = URL.createObjectURL(audioBlob)
      audioDuration.value = recordingDuration.value
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.start()
    isRecording.value = true
    recordingDuration.value = 0
    
    recordingInterval = setInterval(() => {
      recordingDuration.value++
      if (recordingDuration.value >= 30) { // 30 seconds limit
        stopRecording()
      }
    }, 1000)
    
  } catch (error) {
    console.error('Error starting recording:', error)
    alert('Could not access microphone. Please check permissions.')
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    clearInterval(recordingInterval)
  }
}

const toggleAudioPlayback = () => {
  if (!audioElement && audioPreview.value) {
    audioElement = new Audio(audioPreview.value)
    audioElement.addEventListener('ended', () => {
      isAudioPlaying.value = false
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

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const createStatus = async () => {
  if (!canPost.value || isPosting.value) return
  
  isPosting.value = true
  
  try {
    const statusData = {
      content: statusText.value.trim(),
      mediaType: selectedType.value,
      backgroundColor: selectedType.value === 'text' ? selectedColor.value.background : null,
      textColor: selectedType.value === 'text' ? selectedColor.value.text : null
    }
    
    // Handle file upload
    if (selectedImage.value || selectedVideo.value || selectedAudio.value) {
      const formData = new FormData()
      formData.append('content', statusData.content)
      formData.append('mediaType', statusData.mediaType)
      
      if (selectedImage.value) {
        formData.append('media', selectedImage.value)
      } else if (selectedVideo.value) {
        formData.append('media', selectedVideo.value)
      } else if (selectedAudio.value) {
        formData.append('media', selectedAudio.value)
      }
      
      if (statusData.backgroundColor) {
        formData.append('backgroundColor', statusData.backgroundColor)
      }
      if (statusData.textColor) {
        formData.append('textColor', statusData.textColor)
      }
      
      await chatStore.createStatus(formData)
    } else {
      await chatStore.createStatus(statusData)
    }
    
    emit('created')
    
  } catch (error) {
    console.error('Error creating status:', error)
    alert('Failed to create status. Please try again.')
  } finally {
    isPosting.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Focus textarea for text status
  if (selectedType.value === 'text') {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})

onUnmounted(() => {
  // Clean up
  if (recordingInterval) {
    clearInterval(recordingInterval)
  }
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
  
  // Revoke object URLs
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  if (videoPreview.value) URL.revokeObjectURL(videoPreview.value)
  if (audioPreview.value) URL.revokeObjectURL(audioPreview.value)
})
</script>

<style scoped>
.status-creator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.status-creator {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.creator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.creator-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.post-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.post-btn:hover:not(:disabled) {
  background: #1565c0;
}

.post-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.creator-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.status-types {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.type-btn:hover {
  border-color: #1976d2;
}

.type-btn.active {
  border-color: #1976d2;
  background: #e3f2fd;
  color: #1976d2;
}

.type-btn span {
  font-size: 12px;
  font-weight: 500;
}

.text-status {
  margin-bottom: 20px;
}

.text-input-container {
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-textarea {
  width: 100%;
  border: none;
  background: none;
  outline: none;
  resize: none;
  font-size: 18px;
  text-align: center;
  font-weight: 500;
  line-height: 1.4;
}

.status-textarea::placeholder {
  color: inherit;
  opacity: 0.7;
}

.color-palette {
  margin-bottom: 20px;
}

.palette-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
  transform: scale(1.1);
}

.color-option svg {
  width: 16px;
  height: 16px;
  color: white;
}

.image-status,
.video-status {
  margin-bottom: 20px;
}

.image-upload-area,
.video-upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
  margin-bottom: 12px;
}

.image-upload-area:hover,
.video-upload-area:hover {
  border-color: #1976d2;
}

.upload-placeholder {
  color: #666;
}

.upload-placeholder svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.upload-placeholder p {
  margin: 0 0 4px 0;
  font-weight: 500;
}

.upload-placeholder small {
  color: #999;
}

.image-preview,
.video-preview {
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.video-preview video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.remove-image,
.remove-video {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.caption-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
}

.caption-input:focus {
  border-color: #1976d2;
}

.audio-status {
  margin-bottom: 20px;
}

.audio-recorder {
  text-align: center;
  padding: 20px;
}

.recorder-controls {
  margin-bottom: 20px;
}

.record-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: #f44336;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  transition: all 0.2s;
  font-size: 24px;
}

.record-btn:hover {
  background: #d32f2f;
}

.record-btn.recording {
  animation: pulse 1s infinite;
  background: #d32f2f;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.recording-info {
  color: #666;
}

.upload-option {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.upload-audio-btn {
  background: none;
  border: 1px solid #1976d2;
  color: #1976d2;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.2s;
}

.upload-audio-btn:hover {
  background: #1976d2;
  color: white;
}

.audio-preview {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #1976d2;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.audio-waveform {
  flex: 1;
  height: 30px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  display: flex;
  align-items: end;
  padding: 4px;
  gap: 1px;
}

.waveform-bars {
  display: flex;
  align-items: end;
  height: 100%;
  gap: 1px;
  flex: 1;
}

.waveform-bar {
  flex: 1;
  background: #1976d2;
  border-radius: 1px;
  min-height: 2px;
}

.audio-duration {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.remove-audio {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.status-preview {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.preview-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 12px;
}

.preview-container {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
}

.status-preview-item {
  display: flex;
  gap: 12px;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.preview-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.preview-content {
  flex: 1;
}

.preview-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.preview-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.preview-status {
  border-radius: 12px;
  padding: 12px;
  background: white;
}

.preview-text {
  text-align: center;
  font-weight: 500;
  line-height: 1.4;
}

.preview-image img,
.preview-video video {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.preview-placeholder {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 24px;
}

.preview-caption {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .status-creator-overlay {
    padding: 10px;
  }
  
  .status-creator {
    max-height: 95vh;
  }
  
  .creator-content {
    padding: 16px;
  }
  
  .status-types {
    flex-wrap: wrap;
  }
  
  .type-btn {
    min-width: 80px;
  }
}
</style>
