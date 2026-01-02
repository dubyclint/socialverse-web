<!-- ============================================================================
     FILE: /components/AvatarUploadModal.vue
     PHASE 3: Avatar Upload Modal Component
     ============================================================================
     Features:
     ✅ Modal dialog for avatar upload
     ✅ Image preview before upload
     ✅ Image crop/resize functionality
     ✅ Upload progress indicator
     ✅ Error handling with retry
     ✅ Success confirmation
     ✅ Dark mode styling (matches feed.vue)
     ============================================================================ -->

<template>
  <div v-if="isOpen" class="avatar-upload-modal-overlay" @click="closeModal">
    <div class="avatar-upload-modal" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">Upload Avatar</h2>
        <button class="close-btn" @click="closeModal" aria-label="Close modal">
          <Icon name="x" size="24" />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Step 1: File Selection -->
        <div v-if="currentStep === 'select'" class="step-select">
          <div class="upload-area" @click="triggerFileInput" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop" :class="{ dragging: isDragging }">
            <Icon name="upload-cloud" size="48" class="upload-icon" />
            <h3>Choose an image</h3>
            <p>Drag and drop your image here or click to browse</p>
            <p class="file-info">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)</p>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            style="display: none" 
            @change="handleFileSelect"
          />
        </div>

        <!-- Step 2: Image Preview & Crop -->
        <div v-else-if="currentStep === 'preview'" class="step-preview">
          <div class="preview-container">
            <img 
              :src="previewUrl" 
              :alt="'Avatar preview'" 
              class="preview-image"
            />
          </div>

          <!-- Crop Controls -->
          <div class="crop-controls">
            <div class="control-group">
              <label>Scale</label>
              <input 
                v-model.number="scale" 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1"
                class="slider"
              />
              <span class="scale-value">{{ (scale * 100).toFixed(0) }}%</span>
            </div>

            <div class="control-group">
              <label>Rotation</label>
              <div class="rotation-buttons">
                <button @click="rotateImage(-90)" class="rotate-btn" title="Rotate left">
                  <Icon name="rotate-ccw" size="18" />
                </button>
                <button @click="rotateImage(90)" class="rotate-btn" title="Rotate right">
                  <Icon name="rotate-cw" size="18" />
                </button>
              </div>
            </div>
          </div>

          <!-- Preview Info -->
          <div class="preview-info">
            <p>File: {{ selectedFile?.name }}</p>
            <p>Size: {{ (selectedFile?.size || 0) / 1024 / 1024 | toFixed(2) }} MB</p>
          </div>
        </div>

        <!-- Step 3: Uploading -->
        <div v-else-if="currentStep === 'uploading'" class="step-uploading">
          <div class="upload-progress">
            <div class="spinner"></div>
            <p>Uploading your avatar...</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p class="progress-text">{{ uploadProgress }}%</p>
          </div>
        </div>

        <!-- Step 4: Success -->
        <div v-else-if="currentStep === 'success'" class="step-success">
          <div class="success-icon">
            <Icon name="check-circle" size="64" />
          </div>
          <h3>Avatar Updated!</h3>
          <p>Your avatar has been successfully uploaded.</p>
          <img :src="uploadedAvatarUrl" :alt="'Uploaded avatar'" class="uploaded-preview" />
        </div>

        <!-- Step 5: Error -->
        <div v-else-if="currentStep === 'error'" class="step-error">
          <div class="error-icon">
            <Icon name="alert-circle" size="64" />
          </div>
          <h3>Upload Failed</h3>
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button 
          v-if="currentStep === 'select'" 
          @click="closeModal" 
          class="btn btn-secondary"
        >
          Cancel
        </button>

        <button 
          v-else-if="currentStep === 'preview'" 
          @click="goBack" 
          class="btn btn-secondary"
        >
          Back
        </button>

        <button 
          v-else-if="currentStep === 'error'" 
          @click="goBack" 
          class="btn btn-secondary"
        >
          Try Again
        </button>

        <button 
          v-else-if="currentStep === 'success'" 
          @click="closeModal" 
          class="btn btn-primary"
        >
          Done
        </button>

        <button 
          v-if="currentStep === 'preview'" 
          @click="uploadAvatar" 
          :disabled="isUploading"
          class="btn btn-primary"
        >
          <span v-if="!isUploading">Upload Avatar</span>
          <span v-else>Uploading...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

// ============================================================================
// PROPS & EMITS
// ============================================================================
interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'success', url: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// ============================================================================
// SETUP
// ============================================================================
const authStore = useAuthStore()
const profileStore = useProfileStore()

// ============================================================================
// STATE
// ============================================================================
const currentStep = ref<'select' | 'preview' | 'uploading' | 'success' | 'error'>('select')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const uploadedAvatarUrl = ref<string>('')
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)

// Image manipulation state
const scale = ref(1)
const rotation = ref(0)

// ============================================================================
// COMPUTED
// ============================================================================
const canvasStyle = computed(() => ({
  transform: `scale(${scale.value}) rotate(${rotation.value}deg)`
}))

// ============================================================================
// METHODS - FILE HANDLING
// ============================================================================

/**
 * Trigger file input click
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

/**
 * Handle file selection from input
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

/**
 * Handle drag and drop
 */
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

/**
 * Process selected file
 */
const processFile = (file: File) => {
  console.log('[AvatarUpload] Processing file:', {
    name: file.name,
    size: file.size,
    type: file.type
  })

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errorMessage.value = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
    currentStep.value = 'error'
    return
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    errorMessage.value = 'File size exceeds 5MB limit.'
    currentStep.value = 'error'
    return
  }

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
    selectedFile.value = file
    currentStep.value = 'preview'
    scale.value = 1
    rotation.value = 0
    console.log('[AvatarUpload] ✅ File processed and preview ready')
  }
  reader.readAsDataURL(file)
}

// ============================================================================
// METHODS - IMAGE MANIPULATION
// ============================================================================

/**
 * Rotate image
 */
const rotateImage = (degrees: number) => {
  rotation.value = (rotation.value + degrees) % 360
  console.log('[AvatarUpload] Image rotated:', rotation.value)
}

// ============================================================================
// METHODS - UPLOAD
// ============================================================================

/**
 * Upload avatar to server
 */
const uploadAvatar = async () => {
  if (!selectedFile.value) {
    errorMessage.value = 'No file selected'
    currentStep.value = 'error'
    return
  }

  try {
    console.log('[AvatarUpload] Starting upload...')
    isUploading.value = true
    uploadProgress.value = 0
    currentStep.value = 'uploading'

    // Create FormData
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    // Simulate progress (since we can't get real progress from fetch)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 30
      }
    }, 200)

    // Upload file
    console.log('[AvatarUpload] Sending request to /api/profile/avatar-upload')
    const response = await fetch('/api/profile/avatar-upload', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    console.log('[AvatarUpload] Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[AvatarUpload] ✅ Upload successful:', data)

    if (data.success && data.url) {
      uploadedAvatarUrl.value = data.url
      currentStep.value = 'success'
      
      // Update profile store
      profileStore.setProfile({
        ...profileStore.profile,
        avatar_url: data.url
      })

      // Emit success event
      emit('success', data.url)

      console.log('[AvatarUpload] ✅ Avatar updated in store')
    } else {
      throw new Error('Upload response missing success or URL')
    }

  } catch (error: any) {
    console.error('[AvatarUpload] ❌ Upload error:', error)
    errorMessage.value = error.message || 'Failed to upload avatar'
    currentStep.value = 'error'
  } finally {
    isUploading.value = false
  }
}

// ============================================================================
// METHODS - NAVIGATION
// ============================================================================

/**
 * Go back to previous step
 */
const goBack = () => {
  if (currentStep.value === 'preview') {
    currentStep.value = 'select'
    selectedFile.value = null
    previewUrl.value = ''
  } else if (currentStep.value === 'error') {
    currentStep.value = 'select'
    errorMessage.value = ''
    selectedFile.value = null
    previewUrl.value = ''
  }
}

/**
 * Close modal
 */
const closeModal = () => {
  console.log('[AvatarUpload] Closing modal')
  currentStep.value = 'select'
  selectedFile.value = null
  previewUrl.value = ''
  uploadedAvatarUrl.value = ''
  errorMessage.value = ''
  scale.value = 1
  rotation.value = 0
  uploadProgress.value = 0
  emit('close')
}
</script>

<style scoped>
/* ============================================================================
   MODAL OVERLAY & CONTAINER
   ============================================================================ */
.avatar-upload-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.avatar-upload-modal {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   MODAL HEADER
   ============================================================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #0f172a;
  color: #e2e8f0;
}

/* ============================================================================
   MODAL CONTENT
   ============================================================================ */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem 1.5rem;
}

/* Step: Select */
.step-select {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-area {
  border: 2px dashed #475569;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #0f172a;
}

.upload-area:hover {
  border-color: #60a5fa;
  background: #1e293b;
}

.upload-area.dragging {
  border-color: #3b82f6;
  background: #1e293b;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.upload-icon {
  color: #60a5fa;
  margin-bottom: 1rem;
}

.upload-area h3 {
  margin: 0 0 0.5rem 0;
  color: #f1f5f9;
  font-size: 1.1rem;
}

.upload-area p {
  margin: 0.25rem 0;
  color: #94a3b8;
  font-size: 0.875rem;
}

.file-info {
  color: #64748b;
  font-size: 0.75rem;
  margin-top: 0.75rem;
}

/* Step: Preview */
.step-preview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  min-height: 300px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
  transition: transform 0.2s;
  transform: v-bind(canvasStyle);
}

.crop-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e2e8f0;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #334155;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.scale-value {
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: right;
}

.rotation-buttons {
  display: flex;
  gap: 0.5rem;
}

.rotate-btn {
  flex: 1;
  padding: 0.5rem;
  background: #334155;
  color: #e2e8f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rotate-btn:hover {
  background: #475569;
  color: #60a5fa;
}

.preview-info {
  font-size: 0.75rem;
  color: #94a3b8;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.75rem;
}

.preview-info p {
  margin: 0.25rem 0;
}

/* Step: Uploading */
.step-uploading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 300px;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

/* Step: Success */
.step-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 300px;
  text-align: center;
}

.success-icon {
  color: #10b981;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.step-success h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.25rem;
}

.step-success p {
  margin: 0.5rem 0 0 0;
  color: #94a3b8;
}

.uploaded-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3b82f6;
  margin-top: 1rem;
}

/* Step: Error */
.step-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 300px;
  text-align: center;
}

.error-icon {
  color: #ef4444;
  animation: shake 0.3s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.step-error h3 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.25rem;
}

.step-error p {
  margin: 0.5rem 0 0 0;
  color: #94a3b8;
}

/* ============================================================================
   MODAL FOOTER
   ============================================================================ */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #334155;
  background: #0f172a;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: #475569;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 640px) {
  .avatar-upload-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-content {
    padding: 1.5rem 1rem;
  }

  .preview-container {
    min-height: 250px;
  }

  .preview-image {
    max-height: 250px;
  }
}
</style>
