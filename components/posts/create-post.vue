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
        @input="updateCharCount"
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
          {{ publishing ? 'Publishing...' : 'Post' }}
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useFileUpload } from '~/composables/use-file-upload'

// Props & Emits
const emit = defineEmits(['postCreated'])

// Stores
const authStore = useAuthStore()

// Composables
const { 
  uploading, 
  progress, 
  progressPercentage,
  error: uploadError,
  uploadedFiles,
  uploadFile,
  clearError: clearUploadError
} = useFileUpload()

// Reactive Data
const postContent = ref('')
const showEmojiPicker = ref(false)
const publishing = ref(false)
const previewUrl = ref(null)
const mediaFile = ref(null)
const showPrivacy = ref(false)
const selectedPrivacy = ref('public')
const uploadedFileData = ref(null)

// Refs
const fileInputRef = ref(null)

// Computed
const userName = computed(() => authStore.userDisplayName || 'User')
const userHandle = computed(() => authStore.profile?.username || 'user')
const userAvatar = computed(() => authStore.profile?.avatar_url)
const userInitials = computed(() => authStore.userInitials)

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

function insertEmoji(emoji) {
  postContent.value += emoji
  showEmojiPicker.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleMediaUpload(event) {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    if (!validTypes.includes(file.type)) {
      clearUploadError()
      return
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      clearUploadError()
      return
    }

    mediaFile.value = file
    previewUrl.value = URL.createObjectURL(file)

    // Upload file using composable
    try {
      const uploadedFile = await uploadFile(file, 'posts', {
        optimize: true,
        generateThumbnail: file.type.startsWith('image/')
      })

      if (uploadedFile) {
        uploadedFileData.value = uploadedFile
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
  }
}

function removeMedia() {
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

function selectPrivacy(value) {
  selectedPrivacy.value = value
  showPrivacy.value = false
}

function addGif() {
  // TODO: Implement GIF picker
  alert('GIF picker coming soon!')
}

function updateCharCount() {
  // Reactive update - Vue handles this automatically
}

async function publishPost() {
  if (!postContent.value.trim()) return
  
  try {
    publishing.value = true
    
    // Prepare post data
    const postData = {
      content: postContent.value,
      privacy: selectedPrivacy.value,
      media_url: uploadedFileData.value?.url || null,
      media_path: uploadedFileData.value?.path || null,
      user_id: authStore.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Simulate API call (replace with actual API call)
    // const response = await $fetch('/api/posts/create', {
    //   method: 'POST',
    //   body: postData
    // })
    
    // For demo purposes, emit with mock data
    emit('postCreated', {
      id: Date.now(),
      content: postData.content,
      user_id: postData.user_id,
      created_at: postData.created_at,
      privacy: postData.privacy,
      media_url: postData.media_url,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      user_liked: false,
      showComments: false,
      comments: [],
      user: {
        name: userName.value,
        avatar: userAvatar.value,
        handle: userHandle.value
      }
    })
    
    // Reset form
    postContent.value = ''
    removeMedia()
    selectedPrivacy.value = 'public'
    
  } catch (error) {
    console.error('Error publishing post:', error)
    alert('An error occurred while publishing your post. Please try again.')
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
</style>
