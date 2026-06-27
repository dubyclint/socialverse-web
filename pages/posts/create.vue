<!-- FILE: /pages/posts/create.vue -->
<!-- ============================================================================ -->
<!-- CREATE POST PAGE - Dedicated page for creating and publishing posts -->
<!-- ============================================================================ -->

<template>
  <div class="create-post-page">
    <!-- Header Section -->
    <header class="page-header">
      <div class="header-content">
        <button @click="goBack" class="back-btn" title="Go back">
          ← Back
        </button>
        <h1 class="page-title">Create Post</h1>
        <div class="header-spacer"></div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="page-content">
      <div class="create-post-container">
        <!-- User Profile Section -->
        <section class="user-section">
          <div class="user-card">
            <img 
              v-if="userAvatar" 
              :src="userAvatar" 
              :alt="userName" 
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ userInitials }}
            </div>
            <div class="user-details">
              <h2 class="user-name">{{ userName }}</h2>
              <p class="user-handle">@{{ userHandle }}</p>
              <p class="user-status">{{ userStatus }}</p>
            </div>
          </div>
        </section>

        <!-- Post Creation Form -->
        <section class="form-section">
          <!-- Post Content Editor -->
          <div class="editor-container">
            <label for="post-content" class="editor-label">What's on your mind?</label>
            <textarea 
              id="post-content"
              v-model="postContent" 
              placeholder="Share your thoughts, ideas, or updates..."
              class="post-editor"
              rows="8"
              maxlength="2000"
              @input="updateCharCount"
            ></textarea>
            
            <!-- Character Counter -->
            <div class="editor-footer">
              <div class="char-counter">
                <span :class="{ 'char-warning': postContent.length > 1800 }">
                  {{ postContent.length }}/2000 characters
                </span>
              </div>
            </div>
          </div>

          <!-- Media Upload Section -->
          <div class="media-section">
            <h3 class="section-heading">Add Media</h3>
            
            <!-- Media Preview -->
            <div v-if="previewUrl" class="media-preview-container">
              <div class="media-preview">
                <img :src="previewUrl" alt="Preview" class="preview-image" />
                <button @click="removeMedia" class="remove-media-btn" title="Remove media">
                  ✕ Remove
                </button>
                
                <!-- Upload Progress -->
                <div v-if="uploading" class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ progressPercentage }}%</span>
                </div>
              </div>
              
              <!-- Media Info -->
              <div class="media-info">
                <p v-if="mediaFile" class="media-name">
                  📄 {{ mediaFile.name }}
                </p>
                <p v-if="mediaFile" class="media-size">
                  {{ formatFileSize(mediaFile.size) }}
                </p>
              </div>
            </div>

            <!-- Upload Error -->
            <div v-if="uploadError" class="error-alert">
              <span class="error-icon">⚠️</span>
              <span class="error-text">{{ uploadError }}</span>
              <button @click="clearUploadError" class="error-close">✕</button>
            </div>

            <!-- Upload Buttons -->
            <div v-if="!previewUrl" class="upload-buttons">
              <button 
                @click="triggerFileInput" 
                class="upload-btn"
                :disabled="uploading"
              >
                📸 Upload Photo/Video
              </button>
              <button @click="addGif" class="upload-btn">
                🎬 Add GIF
              </button>
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

          <!-- Post Settings Section -->
          <div class="settings-section">
            <h3 class="section-heading">Post Settings</h3>
            
            <!-- Privacy Settings -->
            <div class="setting-group">
              <label class="setting-label">Privacy Level</label>
              <div class="privacy-options">
                <button 
                  v-for="option in privacyOptions" 
                  :key="option.value"
                  @click="selectPrivacy(option.value)"
                  class="privacy-btn"
                  :class="{ active: selectedPrivacy === option.value }"
                  :title="option.label"
                >
                  <span class="privacy-icon">{{ option.icon }}</span>
                  <span class="privacy-name">{{ option.label }}</span>
                </button>
              </div>
            </div>

            <!-- Additional Options -->
            <div class="setting-group">
              <label class="setting-label">Options</label>
              <div class="options-list">
                <label class="option-checkbox">
                  <input 
                    v-model="allowComments" 
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-label">Allow comments</span>
                </label>
                <label class="option-checkbox">
                  <input 
                    v-model="allowSharing" 
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-label">Allow sharing</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Emoji Picker Section -->
          <div class="emoji-section">
            <h3 class="section-heading">Quick Emojis</h3>
            <div class="emoji-grid">
              <button 
                v-for="emoji in popularEmojis" 
                :key="emoji"
                @click="insertEmoji(emoji)"
                class="emoji-btn"
                :title="`Insert ${emoji}`"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-section">
            <button 
              @click="saveDraft" 
              class="btn btn-secondary"
              :disabled="!postContent.trim() || publishing"
            >
              💾 Save Draft
            </button>
            <button 
              @click="publishPost" 
              class="btn btn-primary"
              :disabled="!postContent.trim() || publishing || uploading"
            >
              <span v-if="publishing" class="btn-loading">
                ⏳ Publishing...
              </span>
              <span v-else>
                🚀 Publish Post
              </span>
            </button>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="success-alert">
            <span class="success-icon">✅</span>
            <span class="success-text">{{ successMessage }}</span>
            <button @click="successMessage = ''" class="success-close">✕</button>
          </div>
        </section>

        <!-- Sidebar - Post Preview -->
        <aside class="preview-sidebar">
          <h3 class="sidebar-title">Preview</h3>
          <div class="preview-card">
            <div class="preview-header">
              <img 
                v-if="userAvatar" 
                :src="userAvatar" 
                :alt="userName" 
                class="preview-avatar"
              />
              <div v-else class="preview-avatar-placeholder">
                {{ userInitials }}
              </div>
              <div class="preview-user-info">
                <p class="preview-name">{{ userName }}</p>
                <p class="preview-handle">@{{ userHandle }}</p>
              </div>
            </div>
            
            <div class="preview-content">
              <p v-if="postContent" class="preview-text">{{ postContent }}</p>
              <p v-else class="preview-placeholder">Your post will appear here...</p>
            </div>

            <div v-if="previewUrl" class="preview-media">
              <img :src="previewUrl" :alt="mediaFile?.name" class="preview-image" />
            </div>

            <div class="preview-footer">
              <span class="preview-privacy">{{ privacyLabel }}</span>
              <span class="preview-time">just now</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check'],
  layout: 'default'
})
  
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useFileUpload } from '~/composables/use-file-upload'

// Router & Stores
const router = useRouter()
const authStore = useAuthStore()

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
const publishing = ref(false)
const previewUrl = ref(null)
const mediaFile = ref(null)
const selectedPrivacy = ref('public')
const allowComments = ref(true)
const allowSharing = ref(true)
const successMessage = ref('')

// Refs
const fileInputRef = ref(null)

// Computed Properties
const userName = computed(() => authStore.userDisplayName || 'User')
const userHandle = computed(() => authStore.profile?.username || 'user')
const userAvatar = computed(() => authStore.profile?.avatar_url)
const userInitials = computed(() => authStore.userInitials)
const userStatus = computed(() => authStore.profile?.status || 'Active')

const privacyLabel = computed(() => {
  return privacyOptions.find(opt => opt.value === selectedPrivacy.value)?.label || 'Public'
})

// Constants
const popularEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤗', '🎨', '🎭', '🎪', '🎬']

const privacyOptions = [
  { value: 'public', icon: '🌍', label: 'Public' },
  { value: 'friends', icon: '👥', label: 'Friends Only' },
  { value: 'private', icon: '🔒', label: 'Private' }
]

// Methods
function goBack() {
  router.back()
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

    // Upload file
    try {
      const uploadedFile = await uploadFile(file, 'posts', {
        optimize: true,
        generateThumbnail: file.type.startsWith('image/')
      })

      if (uploadedFile) {
        // File uploaded successfully
        console.log('File uploaded:', uploadedFile)
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
  }
}

function removeMedia() {
  previewUrl.value = null
  mediaFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
  clearUploadError()
}

function selectPrivacy(value) {
  selectedPrivacy.value = value
}

function insertEmoji(emoji) {
  postContent.value += emoji
}

function addGif() {
  alert('GIF picker coming soon!')
}

function updateCharCount() {
  // Reactive update handled by Vue
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function saveDraft() {
  try {
    // Save draft to localStorage or backend
    const draft = {
      content: postContent.value,
      privacy: selectedPrivacy.value,
      media_url: previewUrl.value,
      allowComments: allowComments.value,
      allowSharing: allowSharing.value,
      saved_at: new Date().toISOString()
    }
    
    localStorage.setItem('post_draft', JSON.stringify(draft))
    successMessage.value = '✅ Draft saved successfully!'
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error saving draft:', error)
  }
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
      allow_comments: allowComments.value,
      allow_sharing: allowSharing.value,
      user_id: authStore.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // API call (replace with actual endpoint)
    // const response = await $fetch('/api/posts/create', {
    //   method: 'POST',
    //   body: postData
    // })
    
    // Simulate success
    successMessage.value = '🎉 Post published successfully!'
    
    // Reset form
    postContent.value = ''
    removeMedia()
    selectedPrivacy.value = 'public'
    allowComments.value = true
    allowSharing.value = true
    
    // Clear draft
    localStorage.removeItem('post_draft')
    
    // Redirect after delay
    setTimeout(() => {
      router.push('/posts')
    }, 2000)
    
  } catch (error) {
    console.error('Error publishing post:', error)
    successMessage.value = '❌ Error publishing post. Please try again.'
  } finally {
    publishing.value = false
  }
}

// Load draft on mount
onMounted(() => {
  try {
    const savedDraft = localStorage.getItem('post_draft')
    if (savedDraft) {
      const draft = JSON.parse(savedDraft)
      postContent.value = draft.content || ''
      selectedPrivacy.value = draft.privacy || 'public'
      allowComments.value = draft.allowComments !== false
      allowSharing.value = draft.allowSharing !== false
    }
  } catch (error) {
    console.error('Error loading draft:', error)
  }
})

// Warn before leaving if there's unsaved content
onBeforeUnmount(() => {
  if (postContent.value.trim() && !publishing.value) {
    const confirmed = window.confirm('You have unsaved content. Are you sure you want to leave?')
    if (!confirmed) {
      return false
    }
  }
})
</script>

<style scoped>
.create-post-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 1rem;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #667eea;
  transition: all 0.3s;
  padding: 8px 12px;
  border-radius: 6px;
}

.back-btn:hover {
  background: #f5f5f5;
  color: #764ba2;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
  flex: 1;
  text-align: center;
}

.header-spacer {
  width: 60px;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

.create-post-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

/* User Section */
.user-section {
  margin-bottom: 2rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.user-handle {
  font-size: 14px;
  color: #999;
  margin: 0 0 4px 0;
}

.user-status {
  font-size: 12px;
  color: #667eea;
  margin: 0;
  font-weight: 500;
}

/* Form Section */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-container {
  margin-bottom: 2rem;
}

.editor-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.post-editor {
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  font-size: 16px;
  font-family: inherit;
  color: #333;
  resize: vertical;
  transition: border-color 0.3s;
}

.post-editor:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.char-counter {
  font-size: 12px;
  color: #999;
}

.char-warning {
  color: #ff6b6b;
  font-weight: 600;
}

/* Media Section */
.media-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.section-heading {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.media-preview-container {
  margin-bottom: 1.5rem;
}

.media-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  margin-bottom: 1rem;
}

.preview-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.remove-media-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.remove-media-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 40px;
}

.media-info {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
}

.media-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.media-size {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.error-alert {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 18px;
}

.error-text {
  flex: 1;
  font-size: 14px;
}

.error-close {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 18px;
}

.upload-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.upload-btn {
  padding: 12px 16px;
  background: #f5f5f5;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  transition: all 0.3s;
}

.upload-btn:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #667eea;
  color: #667eea;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

/* Settings Section */
.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.setting-group {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.privacy-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.privacy-btn {
  padding: 12px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.privacy-btn:hover {
  background: #f0f0f0;
  border-color: #667eea;
}

.privacy-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.privacy-icon {
  font-size: 24px;
}

.privacy-name {
  font-size: 12px;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-label {
  user-select: none;
}

/* Emoji Section */
.emoji-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.emoji-btn {
  padding: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.emoji-btn:hover {
  background: white;
  border-color: #667eea;
  transform: scale(1.1);
}

/* Action Section */
.action-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 2px solid #e0e0e0;
}

.btn-secondary:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #667eea;
  color: #667eea;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-alert {
  background: #efe;
  border: 1px solid #cfc;
  color: #3c3;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease-out;
}

.success-icon {
  font-size: 18px;
}

.success-text {
  flex: 1;
  font-size: 14px;
}

.success-close {
  background: none;
  border: none;
  color: #3c3;
  cursor: pointer;
  font-size: 18px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Preview Sidebar */
.preview-sidebar {
  position: sticky;
  top: 120px;
  height: fit-content;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.preview-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.preview-user-info {
  flex: 1;
}

.preview-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.preview-handle {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.preview-content {
  margin-bottom: 1rem;
}

.preview-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin: 0;
  word-wrap: break-word;
}

.preview-placeholder {
  font-size: 14px;
  color: #ccc;
  margin: 0;
  font-style: italic;
}

.preview-media {
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
}

.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.preview-privacy {
  display: inline-block;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-weight: 500;
}

.preview-time {
  font-size: 11px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .create-post-container {
    grid-template-columns: 1fr;
  }

  .preview-sidebar {
    position: static;
  }

  .privacy-options {
    grid-template-columns: 1fr;
  }

  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 768px) {
  .create-post-page {
    padding: 1rem 0.5rem;
  }

  .page-header {
    margin-bottom: 1rem;
  }

  .page-title {
    font-size: 20px;
  }

  .user-card {
    flex-direction: column;
    text-align: center;
  }

  .form-section {
    padding: 1.5rem;
  }

  .upload-buttons {
    grid-template-columns: 1fr;
  }

  .action-section {
    grid-template-columns: 1fr;
  }

  .emoji-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .privacy-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }

  .header-content {
    gap: 0.5rem;
  }

  .page-title {
    font-size: 18px;
  }

  .form-section {
    padding: 1rem;
  }

  .post-editor {
    font-size: 14px;
  }

  .emoji-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .btn {
    font-size: 12px;
    padding: 10px 16px;
  }
}
</style>
