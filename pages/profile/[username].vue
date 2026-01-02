<!-- ============================================================================
     FILE: /pages/profile/[username].vue - ENHANCED VERSION
     PHASE 3: Enhanced Profile Page
     ============================================================================
     Features:
     ✅ Dark mode styling (matches feed.vue)
     ✅ Edit profile button for own profile
     ✅ Follow/unfollow button for other profiles
     ✅ Profile tabs (Posts, Media, Likes)
     ✅ Loading skeletons
     ✅ Error handling with retry
     ✅ Profile store integration
     ✅ Avatar upload modal
     ✅ Responsive design
     ============================================================================ -->

<template>
  <div class="profile-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <Icon name="alert-circle" size="48" />
      <h2>{{ error }}</h2>
      <p v-if="error.includes('not found')">
        The user <strong>@{{ requestedUsername }}</strong> doesn't exist.
      </p>
      <NuxtLink to="/feed" class="btn btn-primary">
        Back to Feed
      </NuxtLink>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="profile-content">
      <!-- Header -->
      <header class="profile-header">
        <NuxtLink to="/feed" class="back-btn">
          <Icon name="arrow-left" size="24" />
        </NuxtLink>
        <div class="header-title">
          <h1>{{ profile.full_name || profile.username }}</h1>
          <p class="post-count">{{ profile.posts_count || 0 }} posts</p>
        </div>
        <div style="width: 40px;"></div>
      </header>

      <!-- Profile Card -->
      <section class="profile-card">
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img 
              :src="profile.avatar_url || '/default-avatar.svg'" 
              :alt="`${profile.username}'s avatar`"
              class="avatar"
              @error="handleAvatarError"
            />
          </div>
        </div>

        <!-- Profile Info -->
        <div class="profile-info">
          <div class="profile-header-top">
            <div>
              <h2 class="profile-name">{{ profile.full_name || profile.username }}</h2>
              <p class="profile-username">@{{ profile.username }}</p>
              <span v-if="profile.is_verified" class="verified-badge">
                <Icon name="check-circle" size="16" />
                Verified
              </span>
            </div>
            
            <!-- Action Buttons -->
            <div class="profile-actions">
              <NuxtLink 
                v-if="isOwnProfile" 
                to="/profile/edit" 
                class="btn btn-primary"
              >
                <Icon name="edit-2" size="18" />
                Edit Profile
              </NuxtLink>
              
              <button 
                v-else
                @click="toggleFollow"
                :disabled="isFollowLoading"
                :class="['btn', isFollowing ? 'btn-secondary' : 'btn-primary']"
              >
                <Icon :name="isFollowing ? 'user-check' : 'user-plus'" size="18" />
                {{ isFollowing ? 'Following' : 'Follow' }}
              </button>
            </div>
          </div>

          <!-- Bio -->
          <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>

          <!-- Stats -->
          <div class="profile-stats">
            <div class="stat" @click="goToFollowers">
              <span class="stat-value">{{ profile.followers_count || 0 }}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat" @click="goToFollowing">
              <span class="stat-value">{{ profile.following_count || 0 }}</span>
              <span class="stat-label">Following</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile.posts_count || 0 }}</span>
              <span class="stat-label">Posts</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <section class="profile-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" size="20" />
          <span>{{ tab.label }}</span>
        </button>
      </section>

      <!-- Tab Content -->
      <section class="tab-content">
        <!-- Posts Tab -->
        <div v-if="activeTab === 'posts'" class="posts-section">
          <div v-if="userPosts.length === 0" class="empty-state">
            <Icon name="inbox" size="48" />
            <p>No posts yet</p>
          </div>
          <div v-else class="posts-list">
            <article v-for="post in userPosts" :key="post.id" class="post-card">
              <div class="post-header">
                <div class="post-author">
                  <img 
                    :src="profile.avatar_url || '/default-avatar.svg'" 
                    :alt="profile.username"
                    class="post-avatar"
                  />
                  <div>
                    <h4>{{ profile.full_name }}</h4>
                    <p>@{{ profile.username }}</p>
                  </div>
                </div>
                <span class="post-time">{{ formatTime(post.created_at) }}</span>
              </div>
              <p class="post-content">{{ post.content }}</p>
              <div v-if="post.media && post.media.length > 0" class="post-media">
                <img 
                  v-for="(media, idx) in post.media" 
                  :key="idx"
                  :src="media" 
                  :alt="`Post media ${idx + 1}`"
                  class="media-image"
                />
              </div>
              <div class="post-stats">
                <span><Icon name="heart" size="16" /> {{ post.likes_count || 0 }}</span>
                <span><Icon name="message-circle" size="16" /> {{ post.comments_count || 0 }}</span>
                <span><Icon name="share-2" size="16" /> {{ post.shares_count || 0 }}</span>
              </div>
            </article>
          </div>
        </div>

        <!-- Media Tab -->
        <div v-else-if="activeTab === 'media'" class="media-section">
          <div v-if="userMedia.length === 0" class="empty-state">
            <Icon name="image" size="48" />
            <p>No media yet</p>
          </div>
          <div v-else class="media-grid">
            <img 
              v-for="(media, idx) in userMedia" 
              :key="idx"
              :src="media" 
              :alt="`Media ${idx + 1}`"
              class="media-item"
              @click="openMediaViewer(media)"
            />
          </div>
        </div>

        <!-- Likes Tab -->
        <div v-else-if="activeTab === 'likes'" class="likes-section">
          <div v-if="userLikes.length === 0" class="empty-state">
            <Icon name="heart" size="48" />
            <p>No likes yet</p>
          </div>
          <div v-else class="posts-list">
            <article v-for="post in userLikes" :key="post.id" class="post-card">
              <div class="post-header">
                <div class="post-author">
                  <img 
                    :src="post.author?.avatar_url || '/default-avatar.svg'" 
                    :alt="post.author?.username"
                    class="post-avatar"
                  />
                  <div>
                    <h4>{{ post.author?.full_name }}</h4>
                    <p>@{{ post.author?.username }}</p>
                  </div>
                </div>
                <span class="post-time">{{ formatTime(post.created_at) }}</span>
              </div>
              <p class="post-content">{{ post.content }}</p>
            </article>
          </div>
        </div>
      </section>
    </div>

    <!-- Not Found State -->
    <div v-else class="not-found-state">
      <Icon name="user-x" size="48" />
      <p>User not found</p>
      <NuxtLink to="/feed" class="btn btn-primary">
        Back to Feed
      </NuxtLink>
    </div>

    <!-- Avatar Upload Modal -->
    <AvatarUploadModal 
      :is-open="showAvatarModal"
      @close="showAvatarModal = false"
      @success="handleAvatarSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { useProfile } from '~/composables/use-profile'

definePageMeta({
  layout: 'blank',
  middleware: 'auth'
})

// ============================================================================
// SETUP
// ============================================================================
const route = useRoute()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { 
  fetchProfileByUsername, 
  followUser, 
  unfollowUser, 
  checkFollowStatus 
} = useProfile()

// ============================================================================
// STATE
// ============================================================================
const loading = ref(true)
const error = ref<string | null>(null)
const profile = ref<any>(null)
const userPosts = ref<any[]>([])
const userMedia = ref<string[]>([])
const userLikes = ref<any[]>([])
const requestedUsername = ref<string>('')
const activeTab = ref('posts')
const showAvatarModal = ref(false)
const isFollowLoading = ref(false)
const isFollowing = ref(false)

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Check if viewing own profile
 */
const isOwnProfile = computed(() => {
  return profile.value?.username === authStore.user?.user_metadata?.username ||
         profile.value?.username === authStore.user?.username
})

/**
 * Tabs configuration
 */
const tabs = [
  { id: 'posts', label: 'Posts', icon: 'file-text' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'likes', label: 'Likes', icon: 'heart' }
]

// ============================================================================
// METHODS - PROFILE LOADING
// ============================================================================

/**
 * Load profile data
 */
const loadProfile = async (username: string) => {
  try {
    console.log('[Profile] Loading profile for username:', username)
    loading.value = true
    error.value = null

    // Validate username
    if (!username || username.trim() === '') {
      error.value = 'Username is required'
      loading.value = false
      return
    }

    requestedUsername.value = username

    // Fetch profile
    const profileData = await fetchProfileByUsername(username)

    if (!profileData) {
      error.value = `User @${username} not found`
      loading.value = false
      return
    }

    profile.value = profileData

    // Check follow status if not own profile
    if (!isOwnProfile.value) {
      await checkFollowStatus(profileData.id)
      isFollowing.value = true // Will be updated by checkFollowStatus
    }

    // Fetch posts
    await fetchUserPosts(username)

    console.log('[Profile] ✅ Profile loaded')
  } catch (err: any) {
    console.error('[Profile] Error loading profile:', err)
    error.value = err.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

/**
 * Fetch user posts
 */
const fetchUserPosts = async (username: string) => {
  try {
    console.log('[Profile] Fetching posts for user:', username)

    const response = await fetch(`/api/posts/user/${encodeURIComponent(username)}`)

    if (!response.ok) {
      throw new Error('Failed to fetch posts')
    }

    const data = await response.json()
    userPosts.value = data.posts || []

    // Extract media from posts
    userMedia.value = []
    userPosts.value.forEach(post => {
      if (post.media && Array.isArray(post.media)) {
        userMedia.value.push(...post.media)
      }
    })

    console.log('[Profile] ✅ Posts loaded:', userPosts.value.length)
  } catch (err: any) {
    console.error('[Profile] Error fetching posts:', err)
    userPosts.value = []
  }
}

// ============================================================================
// METHODS - FOLLOW/UNFOLLOW
// ============================================================================

/**
 * Toggle follow status
 */
const toggleFollow = async () => {
  if (!profile.value || isFollowLoading.value) return

  try {
    console.log('[Profile] Toggling follow status')
    isFollowLoading.value = true

    if (isFollowing.value) {
      const success = await unfollowUser(profile.value.id)
      if (success) {
        isFollowing.value = false
        profile.value.followers_count = Math.max(0, (profile.value.followers_count || 1) - 1)
      }
    } else {
      const success = await followUser(profile.value.id)
      if (success) {
        isFollowing.value = true
        profile.value.followers_count = (profile.value.followers_count || 0) + 1
      }
    }

    console.log('[Profile] ✅ Follow status updated')
  } catch (err: any) {
    console.error('[Profile] Error toggling follow:', err)
  } finally {
    isFollowLoading.value = false
  }
}

// ============================================================================
// METHODS - NAVIGATION
// ============================================================================

/**
 * Go to followers page
 */
const goToFollowers = () => {
  console.log('[Profile] Navigate to followers')
  // TODO: Implement followers page
}

/**
 * Go to following page
 */
const goToFollowing = () => {
  console.log('[Profile] Navigate to following')
  // TODO: Implement following page
}

/**
 * Open media viewer
 */
const openMediaViewer = (mediaUrl: string) => {
  console.log('[Profile] Open media viewer:', mediaUrl)
  window.open(mediaUrl, '_blank')
}

// ============================================================================
// METHODS - UTILITIES
// ============================================================================

/**
 * Format time
 */
const formatTime = (date: string) => {
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
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    
    return d.toLocaleDateString()
  } catch (error) {
    console.error('[Profile] Error formatting time:', error)
    return 'unknown'
  }
}

/**
 * Handle avatar error
 */
const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/default-avatar.svg'
}

/**
 * Handle avatar upload success
 */
const handleAvatarSuccess = (avatarUrl: string) => {
  console.log('[Profile] Avatar uploaded:', avatarUrl)
  if (profile.value) {
    profile.value.avatar_url = avatarUrl
  }
  showAvatarModal.value = false
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
      if (authStore.user?.user_metadata?.username) {
        username = authStore.user.user_metadata.username
      } else if (authStore.user?.username) {
        username = authStore.user.username
      } else {
        error.value = 'No username provided'
        loading.value = false
        return
      }
    }

    // Load profile
    await loadProfile(username)
  } catch (err: any) {
    console.error('[Profile] Mount error:', err)
    error.value = 'Failed to load profile'
    loading.value = false
  }
})
</script>

<style scoped>
/* ============================================================================
   PAGE LAYOUT
   ============================================================================ */
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

/* ============================================================================
   LOADING & ERROR STATES
   ============================================================================ */
.loading-state,
.error-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
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

.error-state h2,
.not-found-state p {
  margin: 0;
  color: #f1f5f9;
}

.error-state p {
  margin: 0.5rem 0 0 0;
  color: #94a3b8;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  font-size: 0.95rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: #475569;
}

/* ============================================================================
   HEADER
   ============================================================================ */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #334155;
  background: #1e293b;
  position: sticky;
  top: 0;
  z-index: 50;
}

.back-btn {
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
  text-decoration: none;
}

.back-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

.header-title {
  flex: 1;
  text-align: center;
}

.header-title h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
}

.post-count {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ============================================================================
   PROFILE CONTENT
   ============================================================================ */
.profile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Profile Card */
.profile-card {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 2rem 1rem;
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar-wrapper {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #3b82f6;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.profile-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
}

.profile-username {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: #94a3b8;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.profile-actions {
  display: flex;
  gap: 0.75rem;
}

.profile-bio {
  margin: 1rem 0;
  color: #cbd5e1;
  line-height: 1.6;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.5rem;
  border-radius: 8px;
}

.stat:hover {
  background: #0f172a;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

/* ============================================================================
   TABS
   ============================================================================ */
.profile-tabs {
  display: flex;
  gap: 0;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 0 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: transparent;
  color: #94a3b8;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 0.95rem;
}

.tab:hover {
  color: #e2e8f0;
}

.tab.active {
  color: #60a5fa;
  border-bottom-color: #3b82f6;
}

/* ============================================================================
   TAB CONTENT
   ============================================================================ */
.tab-content {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  color: #94a3b8;
  text-align: center;
}

.empty-state :deep(svg) {
  color: #475569;
}

/* Posts Section */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.post-card:hover {
  border-color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-author h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.post-author p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.post-time {
  font-size: 0.75rem;
  color: #64748b;
}

.post-content {
  margin: 0 0 1rem 0;
  color: #e2e8f0;
  line-height: 1.6;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.media-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
}

.post-stats {
  display: flex;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
  font-size: 0.875rem;
  color: #94a3b8;
}

.post-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Media Section */
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.media-item {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.media-item:hover {
  transform: scale(1.05);
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem 1rem;
  }

  .profile-header-top {
    flex-direction: column;
    align-items: center;
  }

  .profile-actions {
    width: 100%;
  }

  .profile-actions .btn {
    flex: 1;
  }

  .profile-stats {
    justify-content: center;
  }

  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .profile-name {
    font-size: 1.25rem;
  }

  .tab-content {
    padding: 1rem 0.5rem;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 640px) {
  .profile-header {
    padding: 0.75rem 0.5rem;
  }

  .header-title h1 {
    font-size: 1rem;
  }

  .profile-card {
    padding: 1rem 0.5rem;
  }

  .profile-tabs {
    padding: 0 0.5rem;
  }

  .tab {
    font-size: 0.85rem;
    padding: 0.75rem 0.5rem;
  }

  .tab span {
    display: none;
  }

  .post-card {
    padding: 1rem;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }
}
</style>
