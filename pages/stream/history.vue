// COMPLETE FILE 2: /pages/stream/history.vue
// ============================================================================
// Stream History Page - View past streams and analytics
// ============================================================================

<template>
  <div class="stream-history-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>📹 Stream History</h1>
      <p class="subtitle">View and manage your past streams</p>
    </div>

    <ClientOnly>
      <!-- Filters & Search -->
      <div class="filters-section">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search streams..."
            class="search-input"
          />
        </div>

        <div class="filter-buttons">
          <button 
            v-for="filter in filters" 
            :key="filter"
            :class="['filter-btn', { active: activeFilter === filter }]"
            @click="activeFilter = filter"
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading streams...</p>
      </div>

      <!-- Streams Grid -->
      <div v-else-if="filteredStreams.length > 0" class="streams-grid">
        <div v-for="stream in filteredStreams" :key="stream.id" class="stream-card">
          <!-- Thumbnail -->
          <div class="card-thumbnail">
            <img :src="stream.thumbnail_url" :alt="stream.title" />
            <div class="card-overlay">
              <button @click="viewStream(stream.id)" class="btn-play">
                ▶️ View
              </button>
            </div>
            <div class="card-badge">
              {{ stream.duration }}
            </div>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <h3 class="stream-title">{{ stream.title }}</h3>
            
            <div class="stream-meta">
              <span class="meta-item">
                📅 {{ formatDate(stream.started_at) }}
              </span>
              <span class="meta-item">
                👥 {{ stream.viewer_count }} viewers
              </span>
            </div>

            <div class="stream-stats">
              <div class="stat">
                <span class="stat-label">Peak Viewers</span>
                <span class="stat-value">{{ stream.peak_viewers }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Avg Viewers</span>
                <span class="stat-value">{{ stream.avg_viewers }}</span>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button @click="viewStream(stream.id)" class="btn btn-primary">
                View Stream
              </button>
              <button @click="downloadVOD(stream.id)" class="btn btn-secondary">
                Download VOD
              </button>
              <button @click="deleteStream(stream.id)" class="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📹</div>
        <h3>No streams found</h3>
        <p>You haven't streamed yet. Start your first stream now!</p>
        <NuxtLink to="/stream" class="btn btn-primary">
          Start Streaming
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="filteredStreams.length > 0" class="pagination">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="btn btn-secondary"
        >
          ← Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="btn btn-secondary"
        >
          Next →
        </button>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ============================================================================
// PAGE META - MIDDLEWARE & LAYOUT
// ============================================================================
definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

// ============================================================================
// REACTIVE STATE
// ============================================================================
const loading = ref(false)
const searchQuery = ref('')
const activeFilter = ref('All')
const currentPage = ref(1)
const itemsPerPage = 12

const filters = ['All', 'Recent', 'Popular', 'Archived']

// Sample stream data
const streams = ref([
  {
    id: 1,
    title: 'Gaming Marathon - Part 1',
    thumbnail_url: 'https://via.placeholder.com/300x170',
    started_at: new Date(Date.now() - 86400000),
    duration: '2h 45m',
    viewer_count: 1250,
    peak_viewers: 2100,
    avg_viewers: 1450,
    category: 'gaming',
    status: 'completed'
  },
  {
    id: 2,
    title: 'Music Production Live Session',
    thumbnail_url: 'https://via.placeholder.com/300x170',
    started_at: new Date(Date.now() - 172800000),
    duration: '1h 30m',
    viewer_count: 850,
    peak_viewers: 1200,
    avg_viewers: 950,
    category: 'music',
    status: 'completed'
  },
  {
    id: 3,
    title: 'Creative Drawing Tutorial',
    thumbnail_url: 'https://via.placeholder.com/300x170',
    started_at: new Date(Date.now() - 259200000),
    duration: '3h 15m',
    viewer_count: 2100,
    peak_viewers: 3500,
    avg_viewers: 2300,
    category: 'creative',
    status: 'completed'
  },
  {
    id: 4,
    title: 'Web Development Workshop',
    thumbnail_url: 'https://via.placeholder.com/300x170',
    started_at: new Date(Date.now() - 345600000),
    duration: '2h 00m',
    viewer_count: 1800,
    peak_viewers: 2400,
    avg_viewers: 1900,
    category: 'education',
    status: 'completed'
  },
  {
    id: 5,
    title: 'Sports Commentary - Live Game',
    thumbnail_url: 'https://via.placeholder.com/300x170',
    started_at: new Date(Date.now() - 432000000),
    duration: '4h 30m',
    viewer_count: 5200,
    peak_viewers: 8900,
    avg_viewers: 6100,
    category: 'sports',
    status: 'completed'
  },
  {
    id: 6,
    title: 'Just Chatting - Q&A Session',
    thumbnail_url: 'https://via.placeholder.com/300x170',
    started_at: new Date(Date.now() - 518400000),
    duration: '1h 45m',
    viewer_count: 950,
    peak_viewers: 1600,
    avg_viewers: 1100,
    category: 'other',
    status: 'completed'
  }
])

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================
const filteredStreams = computed(() => {
  let result = streams.value

  // Filter by search query
  if (searchQuery.value) {
    result = result.filter(stream =>
      stream.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Filter by active filter
  if (activeFilter.value !== 'All') {
    if (activeFilter.value === 'Recent') {
      result = result.sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )
    } else if (activeFilter.value === 'Popular') {
      result = result.sort((a, b) => b.viewer_count - a.viewer_count)
    }
  }

  return result
})

const paginatedStreams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredStreams.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredStreams.value.length / itemsPerPage)
})

// ============================================================================
// METHODS
// ============================================================================
const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewStream = (streamId: number) => {
  console.log('Viewing stream:', streamId)
  navigateTo(`/stream/${streamId}`)
}

const downloadVOD = (streamId: number) => {
  console.log('Downloading VOD for stream:', streamId)
  alert('VOD download started!')
}

const deleteStream = (streamId: number) => {
  if (confirm('Are you sure you want to delete this stream?')) {
    streams.value = streams.value.filter(s => s.id !== streamId)
    console.log('Stream deleted:', streamId)
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// ============================================================================
// SEO
// ============================================================================
useHead({
  title: 'Stream History - SocialVerse',
  meta: [
    { name: 'description', content: 'View and manage your past streams' }
  ]
})
</script>

<style scoped>
.stream-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  margin: 0;
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: #e5e7eb;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.streams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.stream-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.stream-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.card-thumbnail {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  overflow: hidden;
  background: #f3f4f6;
}

.card-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.stream-card:hover .card-overlay {
  opacity: 1;
}

.btn-play {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-play:hover {
  background: #2563eb;
  transform: scale(1.05);
}

.card-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.card-content {
  padding: 1.5rem;
}

.stream-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  line-height: 1.4;
}

.stream-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stream-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #3b82f6;
  margin-top: 0.25rem;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  color: #666;
  font-weight: 600;
}

@media (max-width: 768px) {
  .stream-history-container {
    padding: 1rem;
  }

  .streams-grid {
    grid-template-columns: 1fr;
  }

  .filters-section {
    flex-direction: column;
  }

  .search-box {
    min-width: auto;
  }

  .filter-buttons {
    width: 100%;
  }

  .stream-stats {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: row;
  }

  .card-actions .btn {
    flex: 1;
  }
}
</style>
