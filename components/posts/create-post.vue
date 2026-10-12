<template>
  <div class="create-post-modal">
    <div class="create-form">
      <!-- User Info Header -->
      <div class="user-header">
        <img 
          v-if="userAvatar" 
          :src="userAvatar" 
          :alt="userName" 
          class="user-avatar"
        />
        <div v-else class="user-avatar-placeholder">
          {{ userInitials }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-handle">@{{ userHandle }}</div>
        </div>
      </div>

      <!-- Post Content -->
      <textarea 
        v-model="postContent" 
        placeholder="What's on your mind?"
        class="post-textarea"
        rows="4"
        maxlength="2000"
      ></textarea>
      
      <!-- Character Counter -->
      <div class="char-counter">
        <span :class="{ 'char-warning': postContent.length > 1800 }">
          {{ postContent.length }}/2000
        </span>
      </div>

      <!-- Media Preview with Upload Progress -->
      <div v-if="previewUrl" class="media-preview">
        <img :src="previewUrl" alt="Preview" class="preview-image" />
        <button @click="removeMedia" class="remove-media">✕</button>
        
        <!-- Upload Progress Bar -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ progressPercentage }}%</span>
        </div>
      </div>

      <!-- Music track + trimmer for photo/video posts -->
      <div v-if="previewUrl && showMusic" class="music-panel">
        <div class="music-tabs">
          <button type="button" :class="{ on: musicTab === 'catalog' }" @click="musicTab = 'catalog'">Royalty-free</button>
          <button type="button" :class="{ on: musicTab === 'device' }" @click="musicTab = 'device'">From device</button>
          <button type="button" class="music-close" @click="clearMusic">Remove music</button>
        </div>
        <div v-if="musicTab === 'catalog'" class="music-catalog">
          <input v-model.trim="musicQuery" class="music-search" placeholder="Search music" @keyup.enter="loadTracks" />
          <p v-if="tracksError" class="error-message">{{ tracksError }}</p>
          <button v-for="t in tracks" :key="t.id" type="button" class="music-track" :class="{ on: selectedAudio?.id === t.id }" @click="pickTrack(t)">
            <img v-if="t.artwork" :src="t.artwork" alt="" />
            <span><strong>{{ t.title }}</strong><small>{{ t.artist }} · {{ Math.round(t.duration) }}s</small></span>
          </button>
        </div>
        <label v-else class="music-device">
          <input type="file" accept="audio/*" @change="pickDeviceAudio" />
          <span>{{ selectedAudio?.file ? selectedAudio.file.name : 'Choose an audio file' }}</span>
        </label>
        <AudioTrimmer
          v-if="selectedAudio"
          :key="selectedAudio.url"
          :default-audio-url="selectedAudio.url"
          :source-type="selectedAudio.file ? 'custom-device' : 'royalty-free'"
          @on-trim-change="trim = $event"
        />
      </div>

      <!-- Upload Error Message -->
      <div v-if="uploadError" class="error-message">
        {{ uploadError }}
        <button @click="clearUploadError" class="clear-error">✕</button>
      </div>

      <!-- Action Buttons -->
      <div class="post-actions">
        <div class="action-buttons">
          <button @click="toggleEmojiPicker" class="action-btn" title="Add emoji">
            😊
          </button>
          <button 
            @click="triggerFileInput" 
            class="action-btn" 
            title="Add photo/video"
            :disabled="uploading"
          >
            🖼️
          </button>
          <button v-if="previewUrl" type="button" class="action-btn" title="Add music" @click="openMusic">
            🎵
          </button>
          <button @click="addGif" class="action-btn" title="Add GIF">
            GIF
          </button>
          <button @click="togglePrivacy" class="action-btn" title="Privacy">
            {{ privacyIcon }}
          </button>
        </div>
        
        <button 
          @click="publishPost" 
          :disabled="!postContent.trim() || publishing || uploading"
          class="publish-btn"
        >
          {{ mixing ? 'Adding music...' : publishing ? 'Publishing...' : 'Post' }}
        </button>
      </div>
      
      <!-- Emoji Picker -->
      <div v-if="showEmojiPicker" class="emoji-picker">
        <span 
          v-for="emoji in popularEmojis" 
          :key="emoji"
          @click="insertEmoji(emoji)"
          class="emoji-option"
        >
          {{ emoji }}
        </span>
      </div>
      
      <!-- Privacy Selector -->
      <div v-if="showPrivacy" class="privacy-selector">
        <div 
          v-for="option in privacyOptions" 
          :key="option.value"
          class="privacy-option"
          @click="selectPrivacy(option.value)"
        >
          <span class="privacy-icon">{{ option.icon }}</span>
          <span class="privacy-label">{{ option.label }}</span>
        </div>
      </div>
      
      <!-- Hidden File Input -->
      <input 
        ref="fileInputRef"
        type="file" 
        accept="image/*,video/*" 
        @change="handleMediaUpload"
        class="file-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { useFileUpload } from '~/composables/use-file-upload'
import AudioTrimmer, { type TrimChange } from '~/components/AudioTrimmer.vue'

interface CatalogTrack { id: string, title: string, artist: string, duration: number, artwork: string | null, stream_url: string }
interface SelectedAudio { url: string, id?: string, file?: File }

// Props & Emits
const emit = defineEmits(['postCreated'])

// Stores
const userStore = useUserStore()

// Composables
const { 
  uploading, 
  progressPercentage,
  error: uploadError,
  uploadFile,
  clearError: clearUploadError
} = useFileUpload()

// Reactive Data
const postContent = ref('')
const showEmojiPicker = ref(false)
const publishing = ref(false)
const previewUrl = ref<string | null>(null)
const mediaFile = ref<File | null>(null)
const showPrivacy = ref(false)
const selectedPrivacy = ref('public')
const uploadedFileData = ref<any>(null)

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)

// Computed: Accessing unified userStore state
const userName = computed(() => userStore.userDisplayName || 'User')
const userHandle = computed(() => userStore.user?.username || 'user')
const userAvatar = computed(() => userStore.profile?.avatar_url)
const userInitials = computed(() => userStore.userInitials)

// Constants
const popularEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤗']

const privacyOptions = [
  { value: 'public', icon: '🌍', label: 'Public' },
  { value: 'friends', icon: '👥', label: 'Friends' },
  { value: 'private', icon: '🔒', label: 'Private' }
]

const privacyIcon = computed(() => {
  return privacyOptions.find(opt => opt.value === selectedPrivacy.value)?.icon || '🌍'
})

// Methods
function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
  showPrivacy.value = false
}

function insertEmoji(emoji: string) {
  postContent.value += emoji
  showEmojiPicker.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function addGif() {
  triggerFileInput()
}

async function handleMediaUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
  if (!validTypes.includes(file.type)) {
    clearUploadError()
    return
  }

  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    clearUploadError()
    return
  }

  mediaFile.value = file
  previewUrl.value = URL.createObjectURL(file)

  try {
    const uploadedFile = await uploadFile(file, 'posts', {
      optimize: true,
      generateThumbnail: file.type.startsWith('image/')
    })
    if (uploadedFile) uploadedFileData.value = uploadedFile
  } catch (err) {
    console.error('Upload error:', err)
  }
}

const showMusic = ref(false)
const musicTab = ref<'catalog' | 'device'>('catalog')
const musicQuery = ref('')
const tracks = ref<CatalogTrack[]>([])
const tracksError = ref('')
const selectedAudio = ref<SelectedAudio | null>(null)
const trim = ref<TrimChange | null>(null)
const mixing = ref(false)

async function loadTracks() {
  tracksError.value = ''
  try {
    tracks.value = (await $fetch<{ tracks: CatalogTrack[] }>('/api/audio/tracks', { query: { q: musicQuery.value || undefined } })).tracks
  } catch {
    tracksError.value = 'Music catalog is unavailable right now'
  }
}

function openMusic() {
  showMusic.value = true
  if (!tracks.value.length) void loadTracks()
}

function releaseAudio() {
  if (selectedAudio.value?.file) URL.revokeObjectURL(selectedAudio.value.url)
  selectedAudio.value = null
  trim.value = null
}

function pickTrack(track: CatalogTrack) {
  releaseAudio()
  selectedAudio.value = { url: track.stream_url, id: track.id }
}

function pickDeviceAudio(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  releaseAudio()
  selectedAudio.value = { url: URL.createObjectURL(file), file }
}

function clearMusic() {
  releaseAudio()
  showMusic.value = false
}

/** Server-side mix so mobile browsers never run ffmpeg; returns the new MP4. */
async function mixAudio(mediaUrl: string): Promise<{ url: string, type: string }> {
  const form = new FormData()
  form.append('media_url', mediaUrl)
  form.append('start', String(trim.value?.startTime ?? 0))
  form.append('duration', String(trim.value?.duration ?? 15))
  if (selectedAudio.value?.file) form.append('audio', selectedAudio.value.file, selectedAudio.value.file.name)
  else if (selectedAudio.value?.id) form.append('audius_id', selectedAudio.value.id)
  return await $fetch<{ url: string, type: string }>('/api/media/mix', { method: 'POST', body: form })
}

function removeMedia() {
  clearMusic()
  previewUrl.value = null
  mediaFile.value = null
  uploadedFileData.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  clearUploadError()
}

function togglePrivacy() {
  showPrivacy.value = !showPrivacy.value
  showEmojiPicker.value = false
}

function selectPrivacy(value: string) {
  selectedPrivacy.value = value
  showPrivacy.value = false
}

async function publishPost() {
  if (!postContent.value.trim()) return
  
  try {
    publishing.value = true
    
    let mediaUrl = uploadedFileData.value?.url || null
    let mediaType = mediaFile.value?.type || 'image'
    if (mediaUrl && selectedAudio.value && trim.value) {
      mixing.value = true
      try {
        const mixed = await mixAudio(mediaUrl)
        mediaUrl = mixed.url
        mediaType = mixed.type
      } finally {
        mixing.value = false
      }
    }
    const hashtags = Array.from(
      new Set((postContent.value.match(/#[\p{L}0-9_]+/gu) || []).map(tag => tag.slice(1).toLowerCase()))
    )

    const response = await $fetch<{ success: boolean; data?: Record<string, any> }>('/api/posts/create', {
      method: 'POST',
      body: {
        content: postContent.value,
        privacy: selectedPrivacy.value,
        tags: hashtags,
        media: mediaUrl ? [{ url: mediaUrl, type: mediaType }] : []
      }
    })

    const created = response?.data
    if (!created) throw new Error('Post was not created')

    emit('postCreated', {
      ...created,
      media_url: mediaUrl,
      user_liked: false,
      user: {
        name: userName.value,
        avatar: userAvatar.value,
        handle: userHandle.value
      }
    })
    
    postContent.value = ''
    removeMedia()
    selectedPrivacy.value = 'public'
    
  } catch (error) {
    console.error('Error publishing post:', error)
    alert('An error occurred while publishing your post.')
  } finally {
    publishing.value = false
  }
}

// Cleanup
onMounted(() => {
  window.addEventListener('click', () => {
    showEmojiPicker.value = false
    showPrivacy.value = false
  })
})
</script>

<style scoped>
.create-post-modal {
  width: 100%;
  margin-bottom: 2rem;
}

.create-form {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-handle {
  font-size: 14px;
  color: #999;
}

.post-textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 16px;
  font-family: inherit;
  color: #333;
  margin-bottom: 1rem;
}

.post-textarea:focus {
  outline: none;
}

.char-counter {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-bottom: 1rem;
}

.char-warning {
  color: #ff6b6b;
  font-weight: 600;
}

.media-preview {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.remove-media {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.remove-media:hover {
  background: rgba(0, 0, 0, 0.8);
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.progress-text {
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 35px;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.clear-error {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 18px;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background: white;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.publish-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.publish-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.emoji-option {
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.3s;
}

.emoji-option:hover {
  background: white;
}

.privacy-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.privacy-option:hover {
  background: white;
}

.privacy-icon {
  font-size: 18px;
}

.privacy-label {
  font-weight: 500;
  color: #333;
}

.file-input {
  display: none;
}

@media (max-width: 640px) {
  .emoji-picker {
    grid-template-columns: repeat(4, 1fr);
  }

  .post-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .publish-btn {
    width: 100%;
  }
}
.music-panel { display: flex; flex-direction: column; gap: 8px; margin: 10px 0; }
.music-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.music-tabs button { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 999px; padding: 0.3rem 0.8rem; font-size: 0.8rem; }
.music-tabs button.on { background: #2563eb; color: #fff; border-color: #2563eb; }
.music-tabs .music-close { margin-left: auto; color: #f87171; }
.music-catalog { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
.music-search { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 8px 10px; }
.music-track { display: flex; align-items: center; gap: 10px; background: none; border: none; color: #e2e8f0; text-align: left; padding: 6px; border-radius: 8px; min-height: 48px; }
.music-track.on, .music-track:hover { background: #1e293b; }
.music-track img { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.music-track span { display: flex; flex-direction: column; min-width: 0; }
.music-track small { color: #94a3b8; }
.music-device { display: flex; flex-direction: column; gap: 6px; color: #cbd5e1; font-size: 0.85rem; }
</style>

