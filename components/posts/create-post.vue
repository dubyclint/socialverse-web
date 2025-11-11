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

      <!-- Media Preview -->
      <div v-if="previewUrl" class="media-preview">
        <img :src="previewUrl" alt="Preview" class="preview-image" />
        <button @click="removeMedia" class="remove-media">✕</button>
      </div>

      <!-- Action Buttons -->
      <div class="post-actions">
        <div class="action-buttons">
          <button @click="toggleEmojiPicker" class="action-btn" title="Add emoji">
            😊
          </button>
          <button @click="triggerFileInput" class="action-btn" title="Add photo/video">
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
          :disabled="!postContent.trim() || publishing"
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

// Props & Emits
const emit = defineEmits(['postCreated'])

// Stores
const authStore = useAuthStore()

// Reactive Data
const postContent = ref('')
const showEmojiPicker = ref(false)
const publishing = ref(false)
const previewUrl = ref(null)
const mediaFile = ref(null)
const showPrivacy = ref(false)
const selectedPrivacy = ref('public')

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

function handleMediaUpload(event) {
  const file = event.target.files[0]
  if (file) {
    mediaFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

function removeMedia() {
  previewUrl.value = null
  mediaFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
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
  // Reactive update
}

async function publishPost() {
  if (!postContent.value.trim()) return
  
  try {
    publishing.value = true
    
    // Prepare post data
    const postData = {
      content: postContent.value,
      privacy: selectedPrivacy.value,
      media_url: previewUrl.value,
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.user-handle {
  color: #6b7280;
  font-size: 13px;
}

.post-textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
  color: #1f2937;
}

.post-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.char-counter {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.char-warning {
  color: #f59e0b;
  font-weight: 600;
}

.media-preview {
  position: relative;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
  max-height: 300px;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
}

.remove-media {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-media:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #2563eb;
}

.publish-btn {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.emoji-option {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-option:hover {
  background: #f3f4f6;
  transform: scale(1.2);
}

.privacy-selector {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.privacy-option:hover {
  background: #f3f4f6;
}

.privacy-icon {
  font-size: 1.25rem;
}

.privacy-label {
  font-weight: 500;
  color: #1f2937;
}

.file-input {
  display: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .create-form {
    padding: 1rem;
  }

  .post-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .publish-btn {
    width: 100%;
  }

  .emoji-picker {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 480px) {
  .action-buttons {
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: 50px;
  }

  .emoji-picker {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
