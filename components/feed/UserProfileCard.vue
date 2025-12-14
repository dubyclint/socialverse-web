<!-- FILE: /components/feed/UserProfileCard.vue (FIXED) -->
<template>
  <aside class="user-profile-card">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Profile Content -->
    <div v-else-if="user">
      <!-- Avatar Section with Edit -->
      <div class="avatar-section">
        <div class="avatar-container">
          <img 
            v-if="user.avatar" 
            :src="user.avatar" 
            :alt="user.name"
            class="avatar-image"
          />
          <div v-else class="avatar-placeholder">
            {{ user.name?.charAt(0) || 'U' }}
          </div>
          <button 
            class="avatar-edit-btn"
            @click="showAvatarUpload = true"
            title="Change profile picture"
          >
            <Icon name="camera" size="16" />
          </button>
        </div>

        <!-- Avatar Upload Modal -->
        <div v-if="showAvatarUpload" class="modal-overlay" @click="showAvatarUpload = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Update Profile Picture</h3>
              <button class="close-btn" @click="showAvatarUpload = false">
                <Icon name="x" size="20" />
              </button>
            </div>
            <div class="modal-body">
              <ProfileAvatarUpload @uploaded="handleAvatarUpload" />
            </div>
          </div>
        </div>
      </div>

      <!-- User Info -->
      <div class="user-info">
        <h2 class="user-name">{{ user.name }}</h2>
        <p class="user-username">@{{ user.username }}</p>
        <p v-if="user.bio" class="user-bio">{{ user.bio }}</p>
      </div>

      <!-- User Stats -->
      <div class="user-stats">
        <div class="stat">
          <span class="stat-value">{{ userStats.followers }}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ userStats.following }}</span>
          <span class="stat-label">Following</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ userStats.posts }}</span>
          <span class="stat-label">Posts</span>
        </div>
      </div>

      <!-- Verification Badge -->
      <div v-if="user.verified" class="verification-badge">
        <Icon name="check-circle" size="16" />
        <span>Verified</span>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <NuxtLink to="/profile" class="action-btn primary">
          <Icon name="user" size="16" />
          View Profile
        </NuxtLink>
        <NuxtLink to="/settings" class="action-btn secondary">
          <Icon name="settings" size="16" />
          Settings
        </NuxtLink>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Additional Info -->
      <div class="additional-info">
        <div v-if="user.location" class="info-item">
          <Icon name="map-pin" size="16" />
          <span>{{ user.location }}</span>
        </div>
        <div v-if="user.website" class="info-item">
          <Icon name="link" size="16" />
          <a :href="user.website" target="_blank" rel="noopener">
            {{ formatUrl(user.website) }}
          </a>
        </div>
        <div class="info-item">
          <Icon name="calendar" size="16" />
          <span>Joined {{ formatDate(user.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <Icon name="alert-circle" size="48" />
      <h3>Profile Not Found</h3>
      <p>Unable to load your profile. Please try again.</p>
      <button class="retry-btn" @click="loadUserProfile">
        Retry
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'

interface User {
  id: string
  name: string
  username: string
  email: string
  avatar?: string
  bio?: string
  verified: boolean
  location?: string
  website?: string
  createdAt: Date
}

interface UserStats {
  followers: number
  following: number
  posts: number
}

const authStore = useAuthStore()
const showAvatarUpload = ref(false)
const isLoading = ref(true)

const user = ref<User | null>(null)

const userStats = reactive<UserStats>({
  followers: 0,
  following: 0,
  posts: 0
})

/**
 * Load user profile from auth store or API
 */
const loadUserProfile = async () => {
  isLoading.value = true
  try {
    // Get user from auth store
    const authUser = authStore.user
    
    if (!authUser) {
      console.warn('[UserProfileCard] No authenticated user found')
      user.value = null
      return
    }

    // Map auth user to profile user
    user.value = {
      id: authUser.id || '',
      name: authUser.profile?.full_name || authUser.user_metadata?.full_name || 'User',
      username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'user',
      email: authUser.email || '',
      avatar: authUser.profile?.avatar_url || authUser.user_metadata?.avatar_url,
      bio: authUser.profile?.bio || authUser.user_metadata?.bio,
      verified: authUser.profile?.verified || false,
      location: authUser.profile?.location || authUser.user_metadata?.location,
      website: authUser.profile?.website || authUser.user_metadata?.website,
      createdAt: authUser.created_at ? new Date(authUser.created_at) : new Date()
    }

    console.log('[UserProfileCard] ✅ Profile loaded:', user.value)

    // TODO: Fetch stats from API
    userStats.followers = 0
    userStats.following = 0
    userStats.posts = 0

  } catch (error) {
    console.error('[UserProfileCard] Error loading profile:', error)
    user.value = null
  } finally {
    isLoading.value = false
  }
}

const handleAvatarUpload = (avatarUrl: string) => {
  if (user.value) {
    user.value.avatar = avatarUrl
  }
  showAvatarUpload.value = false
  // TODO: Save to backend
}

const formatUrl = (url: string): string => {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })
}

// Load profile on mount
onMounted(() => {
  loadUserProfile()
})

// Watch for auth changes
watch(() => authStore.user, () => {
  loadUserProfile()
})
</script>

<style scoped>
.user-profile-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
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

.error-state h3 {
  margin: 1rem 0 0.5rem;
  color: white;
}

.error-state p {
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.retry-btn {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.avatar-section {
  position: relative;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.avatar-image,
.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #334155;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #1e293b;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.avatar-edit-btn:hover {
  background: #2563eb;
  transform: scale(1.1);
}

/* Modal Styles */
.modal-overlay {
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
}

.modal-content {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #1e293b;
  color: #e2e8f0;
}

.modal-body {
  padding: 1.5rem;
}

/* User Info */
.user-info {
  text-align: center;
}

.user-name {
  margin: 0;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

.user-username {
  margin: 0.25rem 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.user-bio {
  margin: 0.5rem 0 0;
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* User Stats */
.user-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: #0f172a;
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.8rem;
}

/* Verification Badge */
.verification-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #10b98133;
  border: 1px solid #10b981;
  color: #10b981;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
}

.action-btn.secondary {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.action-btn.secondary:hover {
  background: #334155;
  border-color: #475569;
}

/* Divider */
.divider {
  height: 1px;
  background: #334155;
}

/* Additional Info */
.additional-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.info-item a {
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.info-item a:hover {
  color: #60a5fa;
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .user-profile-card {
    position: static;
  }
}
</style>
