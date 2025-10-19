<!-- components/chat/MediaGallery.vue -->
<template>
  <div class="media-gallery-overlay" v-if="show" @click="handleOverlayClick">
    <div class="media-gallery" @click.stop>
      <div class="gallery-header">
        <div class="header-info">
          <h3>Shared Media</h3>
          <p>{{ totalMedia }} items</p>
        </div>
        <div class="header-actions">
          <div class="view-toggle">
            <button 
              class="toggle-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <Icon name="grid" />
            </button>
            <button 
              class="toggle-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <Icon name="list" />
            </button>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <Icon name="x" />
          </button>
        </div>
      </div>

      <div class="gallery-filters">
        <button 
          v-for="filter in filters"
          :key="filter.type"
          class="filter-btn"
          :class="{ active: activeFilter === filter.type }"
          @click="activeFilter = filter.type"
        >
          <Icon :name="filter.icon" />
          {{ filter.label }}
          <span class="filter-count">{{ filter.count }}</span>
        </button>
      </div>

      <div class="gallery-content">
        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="media-grid">
          <div 
            v-for="(media, index) in filteredMedia"
            :key="media.id"
            class="media-item"
            @click="openMediaViewer(media, index)"
          >
            <div class="media-thumbnail">
              <img 
                v-if="media.messageType === 'image'"
                :src="media.thumbnail || media.mediaUrl"
                :alt="media.content"
                loading="lazy"
              />
              <div 
                v-else-if="media.messageType === 'video'"
                class="video-thumbnail"
              >
                <img 
                  :src="media.thumbnail"
                  :alt="media.content"
                  loading="lazy"
                />
                <div class="play-overlay">
                  <Icon name="play" />
                </div>
                <div class="video-duration">
                  {{ formatDuration(media.mediaMetadata?.duration) }}
                </div>
              </div>
              <div 
                v-else-if="media.messageType === 'audio'"
                class="audio-thumbnail"
              >
                <Icon name="music" />
                <div class="audio-duration">
                  {{ formatDuration(media.mediaMetadata?.duration) }}
                </div>
              </div>
              <div 
                v-else
                class="file-thumbnail"
              >
                <Icon :name="getFileIcon(media.mediaMetadata?.mimeType)" />
                <div class="file-name">{{ media.mediaMetadata?.originalName }}</div>
              </div>
            </div>
            
            <div class="media-info">
              <div class="media-date">{{ formatDate(media.createdAt) }}</div>
              <div class="media-size">{{ formatFileSize(media.mediaMetadata?.size) }}</div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="media-list">
          <div 
            v-for="(media, index) in filteredMedia"
            :key="media.id"
            class="media-list-item"
            @click="openMediaViewer(media, index)"
          >
            <div class="list-thumbnail">
              <img 
                v-if="media.messageType === 'image'"
                :src="media.thumbnail || media.mediaUrl"
                :alt="media.content"
              />
              <div 
                v-else-if="media.messageType === 'video'"
                class="video-thumb"
              >
                <img :src="media.thumbnail" :alt="media.content" />
                <Icon name="play" class="play-icon" />
              </div>
              <div 
                v-else
                class="file-thumb"
              >
                <Icon :name="getFileIcon(media.mediaMetadata?.mimeType)" />
              </div>
            </div>
            
            <div class="list-info">
              <div class="list-name">
                {{ media.mediaMetadata?.originalName || 'Media file' }}
              </div>
              <div class="list-details">
                <span>{{ formatDate(media.createdAt) }}</span>
                <span>{{ formatFileSize(media.mediaMetadata?.size) }}</span>
                <span v-if="media.sender">by {{ media.sender.username }}</span>
              </div>
            </div>
            
            <div class="list-actions">
              <button class="action-btn" @click.stop="downloadMedia(media)">
                <Icon name="download" />
              </button>
              <button class="action-btn" @click.stop="shareMedia(media)" v-if="canShare">
                <Icon name="share" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredMedia.length === 0" class="empty-state">
          <Icon name="image" />
          <h4>No media found</h4>
          <p>No {{ activeFilter === 'all' ? 'media files' : activeFilter }} have been shared in this chat yet.</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading media...</p>
        </div>
      </div>

      <!-- Load More -->
      <div class="gallery-footer" v-if="hasMore && !isLoading">
        <button class="load-more-btn" @click="loadMore">
          Load More
        </button>
      </div>
    </div>

    <!-- Media Viewer -->
    <MediaViewer
      :show="showMediaViewer"
      :media="selectedMedia"
      :mediaList="filteredMedia"
      :currentIndex="selectedIndex"
      @close="closeMediaViewer"
      @navigate="navigateMedia"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import Icon from '@/components/ui/Icon.vue'
import MediaViewer from './MediaViewer.vue'

// Props
const props = defineProps({
  show: Boolean,
  chatId: String,
  mediaList: { type: Array, default: () => [] }
})

// Emits
const emit = defineEmits(['close'])

// Reactive data
const viewMode = ref('grid')
const activeFilter = ref('all')
const selectedMedia = ref(null)
const selectedIndex = ref(0)
const showMediaViewer = ref(false)
const isLoading = ref(false)
const hasMore = ref(true)
const page = ref(1)

// Computed properties
const filters = computed(() => [
  {
    type: 'all',
    label: 'All',
    icon: 'folder',
    count: props.mediaList.length
  },
  {
    type: 'images',
    label: 'Images',
    icon: 'image',
    count: props.mediaList.filter(m => m.messageType === 'image').length
  },
  {
    type: 'videos',
    label: 'Videos',
    icon: 'video',
    count: props.mediaList.filter(m => m.messageType === 'video').length
  },
  {
    type: 'audio',
    label: 'Audio',
    icon: 'music',
    count: props.mediaList.filter(m => m.messageType === 'audio').length
  },
  {
    type: 'documents',
    label: 'Documents',
    icon: 'file-text',
    count: props.mediaList.filter(m => m.messageType === 'file').length
  }
])

const filteredMedia = computed(() => {
  if (activeFilter.value === 'all') {
    return props.mediaList
  }
  
  const typeMap = {
    images: 'image',
    videos: 'video',
    audio: 'audio',
    documents: 'file'
  }
  
  return props.mediaList.filter(media => 
    media.messageType === typeMap[activeFilter.value]
  )
})

const totalMedia = computed(() => props.mediaList.length)

const canShare = computed(() => navigator.share)

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const formatDate = (timestamp) => {
  return format(new Date(timestamp), 'MMM d, yyyy')
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
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
  if (mimeType.includes('excel')) return 'file-spreadsheet'
  if (mimeType.includes('zip')) return 'archive'
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('video')) return 'video'
  if (mimeType.includes('audio')) return 'music'
  
  return 'file'
}

const openMediaViewer = (media, index) => {
  selectedMedia.value = media
  selectedIndex.value = index
  showMediaViewer.value = true
}

const closeMediaViewer = () => {
  showMediaViewer.value = false
  selectedMedia.value = null
}

const navigateMedia = (newIndex) => {
  selectedIndex.value = newIndex
  selectedMedia.value = filteredMedia.value[newIndex]
}

const downloadMedia = (media) => {
  if (media.mediaUrl) {
    const link = document.createElement('a')
    link.href = media.mediaUrl
    link.download = media.mediaMetadata?.originalName || 'file'
    link.click()
  }
}

const shareMedia = async (media) => {
  if (navigator.share && media.mediaUrl) {
    try {
      await navigator.share({
        title: 'Shared from SocialVerse',
        text: media.content || 'Check out this media',
        url: media.mediaUrl
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }
}

const loadMore = async () => {
  isLoading.value = true
  
  try {
    const response = await fetch(`/api/chat/${props.chatId}/media?page=${page.value + 1}`)
    const data = await response.json()
    
    if (data.media && data.media.length > 0) {
      page.value++
    } else {
      hasMore.value = false
    }
  } catch (error) {
    console.error('Load more media error:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Load initial media if needed
})
</script>

<style scoped>
.media-gallery-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 20px;
}

.media-gallery {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.header-info h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 2px;
}

.toggle-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: white;
  color: #1976d2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  background: #f0f0f0;
}

.gallery-filters {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover {
  border-color: #1976d2;
}

.filter-btn.active {
  background: #1976d2;
  border-color: #1976d2;
  color: white;
}

.filter-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.2);
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.media-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.media-item:hover {
  transform: scale(1.02);
}

.media-thumbnail {
  position: relative;
  aspect-ratio: 1;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.audio-thumbnail,
.file-thumbnail {
  flex-direction: column;
  gap: 8px;
  color: #666;
  text-align: center;
  padding: 16px;
}

.audio-thumbnail svg,
.file-thumbnail svg {
  width: 32px;
  height: 32px;
}

.file-name {
  font-size: 11px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.media-info {
  padding: 8px;
  text-align: center;
}

.media-date,
.media-size {
  font-size: 11px;
  color: #666;
}

.media-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.media-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.media-list-item:hover {
  background: #f8f9fa;
  border-color: #1976d2;
}

.list-thumbnail {
  width: 48px;
  height: 48px;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.list-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumb {
  position: relative;
  width: 100%;
  height: 100%;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 4px;
  width: 20px;
  height: 20px;
}

.file-thumb {
  color: #666;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.list-details span:not(:last-child)::after {
  content: '•';
  margin-left: 8px;
  color: #ccc;
}

.list-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #1976d2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.gallery-footer {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.load-more-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.load-more-btn:hover {
  background: #1565c0;
}

@media (max-width: 768px) {
  .media-gallery-overlay {
    padding: 10px;
  }
  
  .media-gallery {
    max-height: 95vh;
  }
  
  .gallery-content {
    padding: 16px;
  }
  
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
}
</style>
