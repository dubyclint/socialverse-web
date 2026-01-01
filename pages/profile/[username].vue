<template>
  <div class="profile-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h2>{{ error }}</h2>
      <p v-if="error.includes('not found')">
        The user <strong>@{{ requestedUsername }}</strong> doesn't exist.
      </p>
      <NuxtLink to="/feed" class="btn-back">
        Back to Feed
      </NuxtLink>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="profile-content">
      <!-- Profile Header -->
      <div class="profile-header">
        <!-- Avatar -->
        <div class="avatar-section">
          <img 
            v-if="profile.avatar_url" 
            :src="profile.avatar_url" 
            :alt="`${profile.username}'s avatar`"
            class="avatar"
            @error="handleAvatarError"
          />
          <div v-else class="avatar-placeholder">
            {{ profile.username?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
        </div>

        <!-- Profile Info -->
        <div class="profile-info">
          <div class="profile-header-top">
            <div>
              <h1 class="profile-name">{{ profile.full_name || profile.display_name || profile.username }}</h1>
              <p class="profile-username">@{{ profile.username }}</p>
            </div>
            <div v-if="isOwnProfile" class="profile-actions">
              <NuxtLink to="/settings" class="btn btn-secondary">
                Edit Profile
              </NuxtLink>
            </div>
          </div>

          <!-- Bio -->
          <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>

          <!-- Stats -->
          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">{{ profile.posts_count || 0 }}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile.followers_count || 0 }}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile.following_count || 0 }}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>

          <!-- Verification Status -->
          <div v-if="profile.is_verified" class="verification-badge">
            ✓ Verified
          </div>
        </div>
      </div>

      <!-- User Posts -->
      <div class="posts-section">
        <h2>Posts</h2>
        <div v-if="userPosts.length === 0" class="empty-state">
          <p>No posts yet</p>
        </div>
        <div v-else class="posts-list">
          <div v-for="post in userPosts" :key="post.id" class="post-item">
            <p>{{ post.content }}</p>
            <small>{{ formatDate(post.created_at) }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="not-found-state">
      <p>User not found</p>
      <NuxtLink to="/feed" class="btn-back">
        Back to Feed
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const authStore = useAuthStore()

// ============================================================================
// STATE
// ============================================================================
const loading = ref(true)
const error = ref<string | null>(null)
const profile = ref<any>(null)
const userPosts = ref<any[]>([])
const requestedUsername = ref<string>('')

// ============================================================================
// COMPUTED
// ============================================================================
const isOwnProfile = computed(() => {
  return profile.value?.username === authStore.user?.username
})

// ============================================================================
// METHODS
// ============================================================================
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

const fetchProfile = async (username: string) => {
  loading.value = true
  error.value = null
  profile.value = null
  userPosts.value = []

  try {
    // Validate username
    if (!username || username.trim() === '') {
      error.value = 'Username is required'
      loading.value = false
      return
    }

    requestedUsername.value = username
    console.log('[Profile] Fetching profile for username:', username)

    // Construct URL with proper encoding
    const encodedUsername = encodeURIComponent(username)
    const url = `/api/profile/${encodedUsername}`
    console.log('[Profile] API URL:', url)

    // Fetch profile
    const response = await fetch(url)
    console.log('[Profile] Response status:', response.status)

    if (!response.ok) {
      if (response.status === 404) {
        error.value = `User @${username} not found`
      } else {
        error.value = `Error loading profile (${response.status})`
      }
      loading.value = false
      return
    }

    const data = await response.json()
    console.log('[Profile] Response data:', data)

    if (data?.success && data?.data) {
      profile.value = data.data
      console.log('[Profile] ✅ Profile loaded:', profile.value.username)
    } else {
      error.value = 'Failed to load profile'
    }
  } catch (err: any) {
    console.error('[Profile] Error:', err)
    error.value = `Error: ${err?.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
  try {
    // Get username from route params
    const usernameParam = route.params.username
    let username = ''

    if (Array.isArray(usernameParam)) {
      username = usernameParam[0] || ''
    } else {
      username = String(usernameParam || '')
    }

    console.log('[Profile] Route params:', { usernameParam, username })

    // If no username in route, use current user
    if (!username) {
      if (authStore.user?.username) {
        username = authStore.user.username
      } else {
        error.value = 'No username provided'
        loading.value = false
        return
      }
    }

    // Fetch profile
    await fetchProfile(username)
  } catch (err: any) {
    console.error('[Profile] Mount error:', err)
    error.value = 'Failed to load profile'
    loading.value = false
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading-state,
.error-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h2 {
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.btn-back {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  display: inline-block;
  transition: background 0.3s;
}

.btn-back:hover {
  background: #2563eb;
}

.profile-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.profile-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3b82f6;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: #666;
  border: 3px solid #d1d5db;
}

.profile-info {
  flex: 1;
}

.profile-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.profile-name {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 0;
  color: #111;
}

.profile-username {
  color: #666;
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
}

.profile-bio {
  color: #374151;
  margin: 1rem 0;
  line-height: 1.6;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin: 1.5rem 0;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #111;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
}

.verification-badge {
  display: inline-block;
  background: #d1fae5;
  color: #065f46;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.posts-section {
  margin-top: 2rem;
}

.posts-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #111;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  background: #f9fafb;
  border-radius: 8px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.post-item p {
  margin: 0 0 0.5rem 0;
  color: #111;
}

.post-item small {
  color: #999;
}

/* Responsive Design */
@media (max-width: 640px) {
  .profile-container {
    padding: 1rem 0.5rem;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .profile-header-top {
    flex-direction: column;
    align-items: center;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .profile-stats {
    justify-content: center;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .avatar-placeholder {
    width: 100px;
    height: 100px;
    font-size: 1.5rem;
  }
}
</style>
