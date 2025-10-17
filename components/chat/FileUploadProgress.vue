<!-- components/chat/FileUploadProgress.vue -->
<template>
  <div class="upload-progress-overlay" v-if="uploads.length > 0">
    <div class="upload-progress-panel">
      <div class="panel-header">
        <h4>Uploading Files</h4>
        <button class="minimize-
<!-- components/chat/FileUploadProgress.vue (continued) -->
        <button class="minimize-btn" @click="isMinimized = !isMinimized">
          <Icon :name="isMinimized ? 'chevron-up' : 'chevron-down'" />
        </button>
      </div>

      <div class="upload-list" v-if="!isMinimized">
        <div 
          v-for="upload in uploads" 
          :key="upload.id"
          class="upload-item"
          :class="{ 
            'completed': upload.status === 'completed',
            'error': upload.status === 'error',
            'cancelled': upload.status === 'cancelled'
          }"
        >
          <div class="upload-info">
            <div class="file-icon">
              <Icon :name="getFileIcon(upload.file.type)" />
            </div>
            <div class="file-details">
              <div class="file-name">{{ upload.file.name }}</div>
              <div class="file-size">{{ formatFileSize(upload.file.size) }}</div>
            </div>
          </div>

          <div class="upload-status">
            <div class="progress-container" v-if="upload.status === 'uploading'">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: upload.progress + '%' }"
                ></div>
              </div>
              <div class="progress-text">{{ upload.progress }}%</div>
            </div>

            <div class="status-icon" v-else>
              <Icon 
                name="check-circle" 
                class="success-icon" 
                v-if="upload.status === 'completed'" 
              />
              <Icon 
                name="x-circle" 
                class="error-icon" 
                v-else-if="upload.status === 'error'" 
              />
              <Icon 
                name="minus-circle" 
                class="cancelled-icon" 
                v-else-if="upload.status === 'cancelled'" 
              />
            </div>

            <button 
              class="cancel-btn" 
              @click="cancelUpload(upload.id)"
              v-if="upload.status === 'uploading'"
            >
              <Icon name="x" />
            </button>
          </div>
        </div>
      </div>

      <div class="panel-footer" v-if="!isMinimized">
        <div class="overall-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: overallProgress + '%' }"
            ></div>
          </div>
          <div class="progress-stats">
            {{ completedUploads }} of {{ totalUploads }} files uploaded
          </div>
        </div>
        
        <div class="footer-actions">
          <button 
            class="cancel-all-btn" 
            @click="cancelAllUploads"
            v-if="hasActiveUploads"
          >
            Cancel All
          </button>
          <button 
            class="clear-btn" 
            @click="clearCompleted"
            v-if="hasCompletedUploads"
          >
            Clear Completed
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'

// Props
const props = defineProps({
  uploads: { type: Array, default: () => [] }
})

// Emits
const emit = defineEmits(['cancel', 'cancelAll', 'clearCompleted'])

// Reactive data
const isMinimized = ref(false)

// Computed properties
const totalUploads = computed(() => props.uploads.length)

const completedUploads = computed(() => 
  props.uploads.filter(upload => upload.status === 'completed').length
)

const overallProgress = computed(() => {
  if (totalUploads.value === 0) return 0
  
  const totalProgress = props.uploads.reduce((sum, upload) => {
    if (upload.status === 'completed') return sum + 100
    if (upload.status === 'uploading') return sum + upload.progress
    return sum
  }, 0)
  
  return Math.round(totalProgress / totalUploads.value)
})

const hasActiveUploads = computed(() => 
  props.uploads.some(upload => upload.status === 'uploading')
)

const hasCompletedUploads = computed(() => 
  props.uploads.some(upload => 
    upload.status === 'completed' || 
    upload.status === 'error' || 
    upload.status === 'cancelled'
  )
)

// Methods
const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('word')) return 'file-text'
  if (mimeType.includes('excel')) return 'file-spreadsheet'
  if (mimeType.includes('zip')) return 'archive'
  return 'file'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const cancelUpload = (uploadId) => {
  emit('cancel', uploadId)
}

const cancelAllUploads = () => {
  emit('cancelAll')
}

const clearCompleted = () => {
  emit('clearCompleted')
}
</script>

<style scoped>
.upload-progress-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1500;
  max-width: 400px;
  width: 100%;
}

.upload-progress-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.panel-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.minimize-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.minimize-btn:hover {
  background: #e0e0e0;
}

.upload-list {
  max-height: 300px;
  overflow-y: auto;
}

.upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.upload-item:last-child {
  border-bottom: none;
}

.upload-item.completed {
  background: #f8fff8;
}

.upload-item.error {
  background: #fff8f8;
}

.upload-item.cancelled {
  background: #f8f8f8;
  opacity: 0.7;
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  width: 32px;
  height: 32px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1976d2;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: #666;
  min-width: 30px;
  text-align: right;
}

.status-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon {
  color: #4caf50;
}

.error-icon {
  color: #f44336;
}

.cancelled-icon {
  color: #999;
}

.cancel-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f0f0f0;
  color: #f44336;
}

.panel-footer {
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.overall-progress {
  margin-bottom: 12px;
}

.overall-progress .progress-bar {
  width: 100%;
  height: 6px;
  margin-bottom: 8px;
}

.progress-stats {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.footer-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-all-btn,
.clear-btn {
  background: none;
  border: 1px solid #e0e0e0;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-all-btn {
  color: #f44336;
  border-color: #f44336;
}

.cancel-all-btn:hover {
  background: #fff5f5;
}

.clear-btn {
  color: #666;
}

.clear-btn:hover {
  background: #f0f0f0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .upload-progress-overlay {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .upload-item {
    padding: 10px 16px;
  }
  
  .file-icon {
    width: 28px;
    height: 28px;
  }
  
  .progress-container {
    min-width: 70px;
  }
  
  .progress-bar {
    width: 50px;
  }
}
</style>
