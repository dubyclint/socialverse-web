<!-- FILE: /pages/status.vue - COMPLETE NEW FILE -->
<!-- ============================================================================
     STATUS PAGE - COMPLETE IMPLEMENTATION
     ✅ NEW: Status creation and display
     ============================================================================ -->

<template>
  <div class="status-page">
    <!-- Header -->
    <header class="status-header">
      <div class="header-content">
        <h1 class="page-title">Status Updates</h1>
        <p class="page-subtitle">Share your current status with your followers</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="status-main">
      <!-- Create Status Section -->
      <section class="create-status-section">
        <div class="create-status-card">
          <h2 class="section-title">Create Status</h2>
          
          <!-- Status Form -->
          <form @submit.prevent="handleCreateStatus" class="status-form">
            <!-- Content Input -->
            <div class="form-group">
              <label for="content" class="form-label">Status Message</label>
              <textarea
                id="content"
                v-model="statusForm.content"
                placeholder="What's on your mind? (max 5000 characters)"
                class="form-textarea"
                maxlength="5000"
                rows="4"
              ></textarea>
              <div class="char-count">
                {{ statusForm.content.length }} / 5000
              </div>
            </div>

            <!-- Media Type Selection -->
            <div class="form-group">
              <label for="media_type" class="form-label">Media Type</label>
              <select
                id="media_type"
                v-model="statusForm.media_type"
                class="form-select"
              >
                <option value="text">Text Only</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="emoji">Emoji</option>
              </select>
            </div>

            <!-- Media URL (if applicable) -->
            <div v-if="statusForm.media_type !== 'text'" class="form-group">
              <label for="media_url" class="form-label">Media URL</label>
              <input
                id="media_url"
                v-model="statusForm.media_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                class="form-input"
              />
            </div>

            <!-- Background Color -->
            <div class="form-group">
              <label for="background_color" class="form-label">Background Color</label>
              <div class="color-picker-wrapper">
                <input
                  id="background_color"
                  v-model="statusForm.background_color"
                  type="color"
                  class="color-picker"
                />
                <span class="color-value">{{ statusForm.background_color }}</span>
              </div>
            </div>

            <!-- Text Color -->
            <div class="form-group">
              <label for="text_color" class="form-label">Text Color</label>
              <div class="color-picker-wrapper">
                <input
                  id="text_color"
                  v-model="statusForm.text_color"
                  type="color"
                  class="color-picker"
                />
                <span class="color-value">{{ statusForm.text_color }}</span>
              </div>
            </div>

            <!-- Expiration Time -->
            <div class="form-group">
              <label for="expires_at" class="form-label">Expires At (Optional)</label>
              <input
                id="expires_at"
                v-model="statusForm.expires_at"
                type="datetime-local"
                class="form-input"
              />
            </div>

            <!-- Error Message -->
            <div v-if="statusError" class="error-message">
              {{ statusError }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!statusForm.content.trim() || statusLoading"
              class="btn-submit"
            >
              <span v-if="!statusLoading">Create Status</span>
              <span v-else>Creating...</span>
            </button>
          </form>
        </div>
      </section>

      <!-- Status Preview -->
      <section v-if="statusForm.content" class="status-preview-section">
        <div class="preview-card" :style="{ backgroundColor: statusForm.background_color }">
          <p class="preview-text" :style="{ color: statusForm.text_color }">
            {{ statusForm.content }}
          </p>
          <div v-if="statusForm.media_url && statusForm.media_type !== 'text'" class="preview-media">
            <img
              v-if="statusForm.media_type === 'image'"
              :src="statusForm.media_url"
              :alt="statusForm.content"
              class="preview-image"
            />
            <video
              v-else-if="statusForm.media_type === 'video'"
              :src="statusForm.media_url"
              class="preview-video"
              controls
            ></video>
          </div>
        </div>
      </section>

      <!-- Statuses Feed -->
      <section class="statuses-feed-section">
        <div class="feed-header">
          <h2 class="section-title">Recent Statuses</h2>
          <button
            @click="refreshStatuses"
            :disabled="statusLoading"
            class="btn-refresh"
            title="Refresh"
          >
            🔄
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="statusLoading && statuses.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Loading statuses...</p>
        </div>

        <!-- Statuses List -->
        <div v-else-if="statuses.length > 0" class="statuses-list">
          <div
            v-for="status in statuses"
            :key="status.id"
            class="status-item"
            :style="{ backgroundColor: status.background_color || '#000000' }"
          >
            <div class="status-header-item">
              <img
                :src="status.author?.avatar_url || '/default-avatar.png'"
                :alt="status.author?.full_name"
                class="status-avatar"
              />
              <div class="status-author-info">
                <h4 class="status-author-name">{{ status.author?.full_name }}</h4>
                <p class="status-author-username">@{{ status.author?.username }}</p>
                <span class="status-time">{{ formatTime(status.created_at) }}</span>
              </div>
              <button
                v-if="status.author?.id === currentUserId"
                @click="handleDeleteStatus(status.id)"
                class="btn-delete"
                title="Delete"
              >
                ✕
              </button>
            </div>

            <p class="status-content" :style="{ color: status.text_color || '#ffffff' }">
              {{ status.content }}
            </p>

            <div v-if="status.media_url && status.media_type !== 'text'" class="status-media">
              <img
                v-if="status.media_type === 'image'"
                :src="status.media_url"
                :alt="status.content"
                class="status-image"
              />
              <video
                v-else-if="status.media_type === 'video'"
                :src="status.media_url"
                class="status-video"
                controls
              ></video>
            </div>

            <div v-if="status.expires_at" class="status-expiration">
              Expires: {{ formatTime(status.expires_at) }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <p>No statuses yet. Be the first to share!</p>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMoreStatuses" class="load-more">
          <button
            @click="loadMoreStatuses"
            :disabled="statusLoading"
            class="btn-load-more"
          >
            Load More
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStatus } from '~/composables/use-status'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

useHead({
  title: 'Status - SocialVerse',
  meta: [
    { name: 'description', content: 'Share your status updates with your followers' }
  ]
})

// ============================================================================
// SETUP
// ============================================================================
const authStore = useAuthStore()
const { createStatus, getStatuses, deleteStatus, statuses, loading: statusLoading, error: statusError } = useStatus()

// ============================================================================
// STATE
// ============================================================================
const statusForm = ref({
  content: '',
  media_type: 'text',
  media_url: '',
  background_color: '#000000',
  text_color: '#ffffff',
  expires_at: ''
})

const currentPage = ref(0)
const hasMoreStatuses = ref(true)

// ============================================================================
// COMPUTED
// ============================================================================
const currentUserId = computed(() => authStore.user?.id)

// ============================================================================
// METHODS
// ============================================================================
const handleCreateStatus = async () => {
  if (!statusForm.value.content.trim()) {
    return
  }

  const result = await createStatus(statusForm.value.content, {
    media_type: statusForm.value.media_type,
    media_url: statusForm.value.media_url || undefined,
    background_color: statusForm.value.background_color,
    text_color: statusForm.value.text_color,
    expires_at: statusForm.value.expires_at || undefined
  })

  if (result.success) {
    // Reset form
    statusForm.value = {
      content: '',
      media_type: 'text',
      media_url: '',
      background_color: '#000000',
      text_color: '#ffffff',
      expires_at: ''
    }
  }
}

const handleDeleteStatus = async (statusId: string) => {
  if (!confirm('Are you sure you want to delete this status?')) return

  const result = await deleteStatus(statusId)
  if (result.success) {
    console.log('Status deleted successfully')
  }
}

const refreshStatuses = async () => {
  currentPage.value = 0
  await getStatuses(20, 0)
}

const loadMoreStatuses = async () => {
  currentPage.value++
  const result = await getStatuses(20, currentPage.value * 20)
  if (result.data && result.data.length < 20) {
    hasMoreStatuses.value = false
  }
}

const formatTime = (date: string | Date) => {
  try {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return d.toLocaleDateString()
  } catch (error) {
    return 'unknown'
  }
}

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
  await refreshStatuses()
})
</script>

<style scoped>
/* ============================================================================
   GLOBAL STYLES
   ============================================================================ */
.status-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%);
  color: #e2e8f0;
}

.status-header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 1px solid #334155;
  padding: 2rem 1rem;
  text-align: center;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #94a3b8;
}

/* ============================================================================
   MAIN CONTENT
   ============================================================================ */
.status-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .status-main {
    grid-template-columns: 1fr;
  }
}

/* ============================================================================
   CREATE STATUS SECTION
   ============================================================================ */
.create-status-section {
  grid-column: 1;
}

.create-status-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.section-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #f1f5f9;
}

/* ============================================================================
   FORM STYLES
   ============================================================================ */
.status-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #cbd5e1;
}

.form-textarea,
.form-input,
.form-select {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 0.75rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
}

.form-textarea:hover,
.form-input:hover,
.form-select:hover {
  border-color: #475569;
}

.form-textarea:focus,
.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.char-count {
  font-size: 0.75rem;
  color: #64748b;
  text-align: right;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-picker {
  width: 60px;
  height: 40px;
  border: 1px solid #334155;
  border-radius: 8px;
  cursor: pointer;
}

.color-value {
  font-size: 0.875rem;
  color: #cbd5e1;
  font-family: monospace;
}

.error-message {
  padding: 0.75rem;
  background: #7f1d1d;
  border: 1px solid #dc2626;
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.875rem;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================================================
   STATUS PREVIEW
   ============================================================================ */
.status-preview-section {
  grid-column: 2;
}

.preview-card {
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.preview-text {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.6;
  word-break: break-word;
}

.preview-media {
  margin-top: 1rem;
  max-width: 100%;
}

.preview-image,
.preview-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

/* ============================================================================
   STATUSES FEED
   ============================================================================ */
.statuses-feed-section {
  grid-column: 1 / -1;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.btn-refresh {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  transform: rotate(180deg);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.statuses-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.status-item {
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.status-item:hover {
  border-color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-header-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.status-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.status-author-info {
  flex: 1;
  min-width: 0;
}

.status-author-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.status-author-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.status-time {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.btn-delete {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  transform: scale(1.2);
}

.status-content {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  line-height: 1.6;
  word-break: break-word;
}

.status-media {
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
}

.status-image,
.status-video {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.status-expiration {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.btn-load-more {
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
