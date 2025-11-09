<!-- components/CreatePost.vue -->
<!-- ============================================================================
     CREATE POST COMPONENT - Complete implementation with storage system
     ============================================================================ -->

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
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
        <button @click="closeModal" class="close-btn" title="Close">
          <Icon name="x" size="20" />
        </button>
      </div>
       <!-- Form -->
      <form @submit.prevent="submitPost" class="post-form">
        <!-- Post Content Textarea -->
        <div class="form-group">
          <textarea
            v-model="postContent"
            placeholder="What's on your mind?"
            class="post-textarea"
            rows="4"
            maxlength="2000"
            required
            @input="updateCharCount"
          ></textarea>
          <div class="char-counter">
            <span :class="{ 'char-warning': postContent.length > 1800 }">
              {{ postContent.length }}
            </span>
            <span class="char-max">/2000</span>
          </div>
        </div>
        <!-- Media Upload Section -->
        <div class="form-group media-section">
          <div class="media-header">
            <label class="form-label">Add Media (Optional)</label>
            <span v-if="uploadedFiles.length > 0" class="media-count">
              {{ uploadedFiles.length }} file(s) selected
            </span>
          </div>

          <!-- Upload Area -->
          <div
            class="media-upload-area"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            :class="{ 'is-dragging': isDragging }"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*,video/*"
              multiple
              @change="handleFileSelect"
              class="file-input"
              :disabled="uploading"
            />

            <div class="upload-content">
              <Icon name="upload-cloud" size="32" class="upload-icon" />
              <div class="upload-text">
                <p class="upload-main">
                  <span class="upload-link" @click="$refs.fileInput.click()">
                    Click to upload
                  </span>
                  or drag and drop
                </p>
                <p class="upload-hint">
                  PNG, JPG, GIF, MP4, WebM up to 50MB
                </p>
              </div>
            </div>
          </div>
          <!-- Upload Progress Bar -->
          <div v-if="uploading" class="progress-container">
            <div class="progress-info">
              <span class="progress-label">Uploading...</span>
              <span class="progress-percentage">{{ progressPercentage }}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
          </div>

          <!-- Upload Error Message -->
          <div v-if="error" class="error-alert">
            <Icon name="alert-circle" size="18" />
            <div class="error-content">
              <div class="error-title">Upload Error</div>
              <div class="error-message">{{ error }}</div>
            </div>
            <button
              type="button"
              @click="clearError"
              class="error-close"
              title="Dismiss"
            >
              <Icon name="x" size="18" />
            </button>
          </div>
          <!-- Uploaded Files Preview Grid -->
          <div v-if="uploadedFiles.length > 0" class="uploaded-files-grid">
            <div
              v-for="(file, index) in uploadedFiles"
              :key="index"
              class="file-preview-card"
            >
              <!-- File Thumbnail -->
              <div class="file-thumbnail-wrapper">
                <img
                  v-if="file.mimeType.startsWith('image/')"
                  :src="file.thumbnailUrl || file.url"
                  :alt="file.filename"
                  class="file-thumbnail"
                />
                <div
                  v-else-if="file.mimeType.startsWith('video/')"
                  class="video-thumbnail"
                >
                  <Icon name="play-circle" size="48" />
                  <video
                    :src="file.url"
                    class="video-preview"
                    muted
                  ></video>
                </div>
                <!-- File Badge -->
                <div class="file-badge">
                  {{ file.mimeType.split('/')[0].toUpperCase() }}
                </div>

                <!-- Delete Button -->
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="delete-file-btn"
                  :disabled="uploading"
                  title="Remove file"
                >
                  <Icon name="trash-2" size="18" />
                </button>
              </div>

              <!-- File Info -->
              <div class="file-info">
                <div class="file-name" :title="file.filename">
                  {{ truncateFilename(file.filename) }}
                </div>
                <div class="file-size">
                  {{ formatFileSize(file.size) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Privacy Settings -->
        <div class="form-group">
          <label class="form-label">Privacy</label>
          <div class="privacy-options">
            <label
              v-for="option in privacyOptions"
              :key="option.value"
              class="privacy-option"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="postPrivacy"
                class="privacy-radio"
              />
              <span class="privacy-icon">{{ option.icon }}</span>
              <div class="privacy-text">
                <div class="privacy-label">{{ option.label }}</div>
                <div class="privacy-description">{{ option.description }}</div>
              </div>
            </label>
          </div>
        </div>
        <!-- Tags Section -->
        <div class="form-group">
          <label class="form-label">Tags (Optional)</label>
          <div class="tag-input-wrapper">
            <input
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              @keydown.comma.prevent="addTag"
              placeholder="Add tags and press Enter"
              class="tag-input"
              :disabled="uploading || loading"
            />
            <button
              v-if="tagInput.trim()"
              type="button"
              @click="addTag"
              class="tag-add-btn"
              :disabled="uploading || loading"
            >
              <Icon name="plus" size="18" />
            </button>
          </div>

          <!-- Tags Display -->
          <div v-if="tags.length > 0" class="tags-list">
            <div
              v-for="(tag, index) in tags"
              :key="index"
              class="tag-item"
            >
              <span class="tag-text">#{{ tag }}</span>
              <button
                type="button"
                @click="removeTag(index)"
                class="tag-remove"
                :disabled="uploading || loading"
                title="Remove tag"
              >
                <Icon name="x" size="14" />
              </button>
            </div>
          </div>
        </div>
        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            @click="closeModal"
            class="btn btn-secondary"
            :disabled="uploading || loading"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!postContent.trim() || uploading || loading"
          >
            <Icon v-if="loading" name="loader" size="18" class="spinner" />
            {{ loading ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFileUpload } from '~/composables/useFileUpload'
import { useAuthStore } from '~/stores/auth'

// ============================================================================
// EMITS
// ============================================================================

const emit = defineEmits<{
  close: []
  'post-created': [post: any]
}>()

// ============================================================================
// STORES
// ============================================================================

const authStore = useAuthStore()

// ============================================================================
// REFS
// ============================================================================

const postContent = ref('')
const postPrivacy = ref('public')
const tagInput = ref('')
const tags = ref<string[]>([])
const loading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

// ============================================================================
// COMPOSABLES
// ============================================================================

const {
  uploading,
  progressPercentage,
  error,
  uploadedFiles,
  uploadFile,
  deleteFile,
  clearUploaded,
  clearError
} = useFileUpload()

// ============================================================================
// COMPUTED
// ============================================================================

const userName = computed(() => authStore.userDisplayName)
const userHandle = computed(() => authStore.profile?.username || 'user')
const userAvatar = computed(() => authStore.profile?.avatar_url)
const userInitials = computed(() => authStore.userInitials)

const privacyOptions = [
  {
    value: 'public',
    icon: '🌍',
    label: 'Public',
    description: 'Anyone can see'
  },
  {
    value: 'friends',
    icon: '👥',
    label: 'Friends',
    description: 'Only friends can see'
  },
  {
    value: 'private',
    icon: '🔒',
    label: 'Private',
    description: 'Only you can see'
  }
]

// ============================================================================
// METHODS
// ============================================================================

/**
 * Handle file selection from input
 */
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files) return

  clearError()
  await uploadFiles(Array.from(files))

  // Reset file input
  target.value = ''
}

/**
 * Handle drag and drop
 */
const handleDrop = async (event: DragEvent) => {
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (!files) return

  clearError()
  await uploadFiles(Array.from(files))
}

/**
 * Upload files
 */
const uploadFiles = async (files: File[]) => {
  for (const file of files) {
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      clearError()
      continue
    }

    await uploadFile(file, 'posts', {
      optimize: file.type.startsWith('image/'),
      generateThumbnail: file.type.startsWith('image/')
    })
  }
}

/**
 * Remove uploaded file
 */
const removeFile = async (index: number) => {
  const file = uploadedFiles.value[index]
  if (file) {
    await deleteFile(file.bucket, file.path)
  }
}

/**
 * Add tag
 */
const addTag = () => {
  const tag = tagInput.value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  if (tag && !tags.value.includes(tag) && tags.value.length < 10) {
    tags.value.push(tag)
    tagInput.value = ''
  }
}

/**
 * Remove tag
 */
const removeTag = (index: number) => {
  tags.value.splice(index, 1)
}

/**
 * Update character count
 */
const updateCharCount = () => {
  // Reactive update
}

/**
 * Format file size
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Truncate filename
 */
const truncateFilename = (filename: string, maxLength: number = 20): string => {
  if (filename.length <= maxLength) return filename
  const ext = filename.split('.').pop()
  const name = filename.substring(0, maxLength - ext!.length - 4)
  return `${name}...${ext}`
}

/**
 * Submit post
 */
const submitPost = async () => {
  if (!postContent.value.trim()) {
    clearError()
    return
  }

  loading.value = true

  try {
    // Prepare media data
    const media = uploadedFiles.value.map(f => ({
      url: f.url,
      thumbnailUrl: f.thumbnailUrl,
      type: f.mimeType.split('/')[0],
      mimeType: f.mimeType,
      size: f.size
    }))

    // Create post
    const response = await $fetch('/api/posts/create', {
      method: 'POST',
      body: {
        content: postContent.value,
        privacy: postPrivacy.value,
        tags: tags.value,
        media: media.length > 0 ? media : undefined
      }
    })

    if (response.success) {
      emit('post-created', response.data)
      closeModal()
    } else {
      clearError()
      console.error('Post creation failed:', response.error)
    }
  } catch (err: any) {
    clearError()
    console.error('Post creation error:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Close modal
 */
const closeModal = () => {
  postContent.value = ''
  postPrivacy.value = 'public'
  tagInput.value = ''
  tags.value = []
  clearUploaded()
  clearError()
  isDragging.value = false
  emit('close')
}

/**
 * Handle escape key
 */
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !uploading.value && !loading.value) {
    closeModal()
  }
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped>
/* ============================================================================
   MODAL OVERLAY & CONTAINER
   ============================================================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ============================================================================
   MODAL HEADER
   ============================================================================ */

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.user-avatar,
.user-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.user-info {
  min-width: 0;
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

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

/* ============================================================================
   FORM
   ============================================================================ */

.post-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================================================
   TEXTAREA
   ============================================================================ */

.post-textarea {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-family: inherit;
  font-size: 16px;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;
  color: #1f2937;
}

.post-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.post-textarea::placeholder {
  color: #9ca3af;
}

.char-counter {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.char-warning {
  color: #f59e0b;
  font-weight: 600;
}

.char-max {
  color: #d1d5db;
}

/* ============================================================================
   MEDIA SECTION
   ============================================================================ */

.media-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.media-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-count {
  font-size: 12px;
  background: #e3f2fd;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
}

/* ============================================================================
   UPLOAD AREA
   ============================================================================ */

.media-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.media-upload-area:hover {
  border-color: #2563eb;
  background: #f0f7ff;
}

.media-upload-area.is-dragging {
  border-color: #2563eb;
  background: #f0f7ff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-icon {
  color: #2563eb;
  opacity: 0.8;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-main {
  margin: 0;
  font-size: 15px;
  color: #1f2937;
  font-weight: 500;
}

.upload-link {
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s;
}

.upload-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.upload-hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

/* ============================================================================
   PROGRESS BAR
   ============================================================================ */

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.progress-label {
  color: #6b7280;
  font-weight: 500;
}

.progress-percentage {
  color: #2563eb;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  transition: width 0.3s ease-out;
  border-radius: 3px;
}

/* ============================================================================
   ERROR ALERT
   ============================================================================ */

.error-alert {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}

.error-alert svg {
  flex-shrink: 0;
  color: #dc2626;
}

.error-content {
  flex: 1;
  min-width: 0;
}

.error-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
}

.error-message {
  font-size: 12px;
  color: #7f1d1d;
}

.error-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.error-close:hover {
  color: #991b1b;
}

/* ============================================================================
   UPLOADED FILES GRID
   ============================================================================ */

.uploaded-files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.file-preview-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.file-preview-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.file-thumbnail-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #f3f4f6;
  overflow: hidden;
}

.file-thumbnail,
.video-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2937, #374151);
  color: white;
}

.video-preview {
  display: none;
}

.file-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.delete-file-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
}

.file-preview-card:hover .delete-file-btn {
  opacity: 1;
}

.delete-file-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 1);
  transform: scale(1.1);
}

.delete-file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-info {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #6b7280;
}

/* ============================================================================
   PRIVACY OPTIONS
   ============================================================================ */

.privacy-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.privacy-option:hover {
  border-color: #2563eb;
  background: #f0f7ff;
}

.privacy-radio {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
  flex-shrink: 0;
}

.privacy-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.privacy-text {
  flex: 1;
  min-width: 0;
}

.privacy-label {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.privacy-description {
  font-size: 12px;
  color: #6b7280;
}

/* ============================================================================
   TAGS
   ============================================================================ */

.tag-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  color: #1f2937;
}

.tag-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tag-input::placeholder {
  color: #9ca3af;
}

.tag-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.tag-add-btn {
  padding: 10px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tag-add-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: scale(1.05);
}

.tag-add-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
  color: #2563eb;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.tag-text {
  white-space: nowrap;
}

.tag-remove {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  flex-shrink: 0;
}

.tag-remove:hover:not(:disabled) {
  color: #1d4ed8;
}

.tag-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================================
   FORM ACTIONS
   ============================================================================ */

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 100px;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ============================================================================
   RESPONSIVE
   ============================================================================ */

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    border-radius: 16px 16px 0 0;
    max-height: 100vh;
  }

  .modal-header {
    padding: 16px;
  }

  .post-form {
    padding: 16px;
    gap: 16px;
  }

  .uploaded-files-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }

  .privacy-options {
    gap: 6px;
  }

  .privacy-option {
    padding: 10px;
  }

  .privacy-text {
    display: none;
  }

  .privacy-label {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    width: 100%;
  }

  .close-btn {
    align-self: flex-end;
  }

  .post-textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  .uploaded-files-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .tag-input-wrapper {
    flex-direction: column;
  }

  .tag-add-btn {
    width: 100%;
  }
}

/* ============================================================================
   SCROLLBAR STYLING
   ============================================================================ */

.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
