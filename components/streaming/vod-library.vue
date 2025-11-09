<template>
  <div class="vod-library">
    <div class="library-header">
      <h2>Video Library</h2>
      <div class="library-controls">
        <select v-model="sortBy" @change="loadRecordings">
          <option value="created_at">Latest First</option>
          <option value="duration">Duration</option>
          <option value="views">Most Viewed</option>
        </select>
        <input 
          v-model="searchQuery" 
          placeholder="Search recordings..."
          @input="debounceSearch"
        >
      </div>
    </div>

    <div class="recordings-grid">
      <div 
        v-for="recording in recordings" 
        :key="recording.id"
        class="recording-card"
      >
        <div class="recording-thumbnail">
          <img 
            :src="recording.thumbnail_path || '/default-thumbnail.jpg'" 
            :alt="recording.title"
            @click="playRecording(recording)"
          >
          <div class="recording-duration">
            {{ formatDuration(recording.duration) }}
          </div>
          <div class="recording-actions">
            <button @click="createHighlight(recording)" class="action-btn">
              Create Highlight
            </button>
            <button @click="downloadRecording(recording)" class="action-btn">
              Download
            </button>
            <button @click="deleteRecording(recording)" class="action-btn danger">
              Delete
            </button>
          </div>
        </div>
        
        <div class="recording-info">
          <h3 class="recording-title">{{ recording.title || 'Untitled Stream' }}</h3>
          <div class="recording-meta">
            <span class="recording-date">{{ formatDate(recording.created_at) }}</span>
            <span class="recording-views">{{ recording.views || 0 }} views</span>
            <span class="recording-size">{{ formatFileSize(recording.file_size) }}</span>
          </div>
          
          <!-- Highlights for this recording -->
          <div v-if="recording.stream_highlights?.length" class="highlights">
            <h4>Highlights</h4>
            <div class="highlight-list">
              <div 
                v-for="highlight in recording.stream_highlights" 
                :key="highlight.id"
                class="highlight-item"
                @click="playHighlight(highlight)"
              >
                <span class="highlight-title">{{ highlight.title }}</span>
                <span class="highlight-duration">
                  {{ formatDuration(highlight.end_time - highlight.start_time) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button 
        v-for="page in pagination.totalPages" 
        :key="page"
        @click="loadPage(page)"
        :class="{ active: page === pagination.page }"
        class="page-btn"
      >
        {{ page }}
      </button>
    </div>

    <!-- Video Player Modal -->
    <div v-if="currentVideo" class="video-modal" @click="closeVideo">
      <div class="video-container" @click.stop>
        <video 
          ref="videoPlayer"
          :src="currentVideo.file_path"
          controls
          autoplay
        ></video>
        <button @click="closeVideo" class="close-btn">×</button>
      </div>
    </div>

    <!-- Highlight Creation Modal -->
    <div v-if="showHighlightModal" class="highlight-modal" @click="closeHighlightModal">
      <div class="highlight-form" @click.stop>
        <h3>Create Highlight</h3>
        <div class="form-group">
          <label>Title:</label>
          <input v-model="highlightForm.title" placeholder="Highlight title...">
        </div>
        <div class="form-group">
          <label>Start Time (seconds):</label>
          <input v-model="highlightForm.startTime" type="number" min="0">
        </div>
        <div class="form-group">
          <label>End Time (seconds):</label>
          <input v-model="highlightForm.endTime" type="number" min="0">
        </div>
        <div class="form-actions">
          <button @click="submitHighlight" class="submit-btn">Create</button>
          <button @click="closeHighlightModal" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  userId: String
})

const recordings = ref([])
const pagination = ref({})
const sortBy = ref('created_at')
const searchQuery = ref('')
const currentVideo = ref(null)
const showHighlightModal = ref(false)
const selectedRecording = ref(null)

const highlightForm = ref({
  title: '',
  startTime: 0,
  endTime: 0
})

let searchTimeout = null

const loadRecordings = async (page = 1) => {
  try {
    const response = await $fetch(`/api/recordings/vod/${props.userId}`, {
      query: {
        page,
        sortBy: sortBy.value,
        search: searchQuery.value
      }
    })
    
    if (response.success) {
      recordings.value = response.recordings
      pagination.value = response.pagination
    }
  } catch (error) {
    console.error('Failed to load recordings:', error)
  }
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadRecordings(1)
  }, 500)
}

const playRecording = (recording) => {
  currentVideo.value = recording
}

const playHighlight = (highlight) => {
  // Play highlight with specific start/end times
  currentVideo.value = {
    ...highlight,
    file_path: highlight.file_path,
    startTime: highlight.start_time,
    endTime: highlight.end_time
  }
}

const closeVideo = () => {
  currentVideo.value = null
}

const createHighlight = (recording) => {
  selectedRecording.value = recording
  highlightForm.value = {
    title: '',
    startTime: 0,
    endTime: Math.min(recording.duration || 300, 300) // Default 5 minutes or recording duration
  }
  showHighlightModal.value = true
}

const closeHighlightModal = () => {
  showHighlightModal.value = false
  selectedRecording.value = null
}

const submitHighlight = async () => {
  try {
    const response = await $fetch('/api/recordings/highlight', {
      method: 'POST',
      body: {
        recordingId: selectedRecording.value.id,
        title: highlightForm.value.title,
        startTime: highlightForm.value.startTime,
        endTime: highlightForm.value.endTime
      }
    })
    
    if (response.success) {
      // Refresh recordings to show new highlight
      await loadRecordings(pagination.value.page)
      closeHighlightModal()
    }
  } catch (error) {
    console.error('Failed to create highlight:', error)
  }
}

const downloadRecording = (recording) => {
  const link = document.createElement('a')
  link.href = recording.file_path
  link.download = `${recording.title || 'recording'}.mp4`
  link.click()
}

const deleteRecording = async (recording) => {
  if (confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
    try {
      await $fetch(`/api/recordings/${recording.id}`, {
        method: 'DELETE'
      })
      
      // Remove from local list
      recordings.value = recordings.value.filter(r => r.id !== recording.id)
    } catch (error) {
      console.error('Failed to delete recording:', error)
    }
  }
}

const loadPage = (page) => {
  loadRecordings(page)
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

onMounted(() => {
  loadRecordings()
})
</script>

<style scoped>
.vod-library {
  padding: 20px;
  color: white;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.library-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.library-controls select,
.library-controls input {
  background: #2d2d2d;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 8px 12px;
  border-radius: 6px;
}

.recordings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

.recording-card {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;
}

.recording-card:hover {
  transform: translateY(-4px);
}

.recording-thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.recording-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.recording-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.recording-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.recording-card:hover .recording-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.8);
}

.recording-info {
  padding: 16px;
}

.recording-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.recording-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888;
  margin-bottom: 12px;
}

.highlights h4 {
  font-size: 14px;
  margin-bottom: 8px;
}

.highlight-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.highlight-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #2d2d2d;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.highlight-item:hover {
  background: #3d3d3d;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.page-btn {
  background: #2d2d2d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn.active {
  background: #10b981;
}

.video-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.video-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.video-container video {
  width: 100%;
  height: auto;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.highlight-modal {
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
}

.highlight-form {
  background: #1a1a1a;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  background: #2d2d2d;
  color: white;
  border: 1px solid #4d4d4d;
  padding: 8px 12px;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.submit-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.cancel-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
