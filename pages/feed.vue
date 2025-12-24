<!-- FILE: /pages/feed.vue - COMPLETE FIXED VERSION -->
<!-- ============================================================================
     FEED PAGE - FIXED: Uses auth token, proper data fetching, sidebar integration
     ✅ FIXED: Uses useFetchWithAuth composable
     ✅ FIXED: Proper error handling and loading states
     ✅ FIXED: Integrated sidebar menu from FeedHeader
     ✅ FIXED: All API endpoints with auth token
     ============================================================================ -->

<template>
  <div class="feed-page">
    <!-- HEADER WITH INTEGRATED SIDEBAR -->
    <FeedHeader />

    <!-- MAIN CONTENT -->
    <main class="feed-main">
      <!-- Left Sidebar - User Profile Card -->
      <ClientOnly>
        <aside class="feed-sidebar-left">
          <div class="profile-card">
            <div class="profile-header">
              <img 
                :src="userAvatar" 
                :alt="userName" 
                class="profile-avatar"
              />
              <div class="profile-info">
                <h3 class="profile-name">{{ userName }}</h3>
                <p class="profile-username">@{{ userUsername }}</p>
              </div>
            </div>
            <div class="profile-stats">
              <div class="stat">
                <span class="stat-value">{{ userFollowers }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ userFollowing }}</span>
                <span class="stat-label">Following</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ userPosts }}</span>
                <span class="stat-label">Posts</span>
              </div>
            </div>
            <button class="btn-edit-profile" @click="goToProfile">
              Edit Profile
            </button>
          </div>
        </aside>
      </ClientOnly>

      <!-- Center Feed -->
      <section class="feed-content">
        <!-- Create Post Section -->
        <ClientOnly>
          <div class="create-post-section">
            <div class="create-post-header">
              <img 
                :src="userAvatar" 
                :alt="userName" 
                class="create-post-avatar"
              />
              <input 
                type="text" 
                placeholder="What's on your mind?" 
                class="create-post-input"
                @click="goToCreatePost"
              />
            </div>
            <div class="create-post-actions">
              <button class="action-btn">
                <Icon name="image" size="18" />
                Photo
              </button>
              <button class="action-btn">
                <Icon name="video" size="18" />
                Video
              </button>
              <button class="action-btn">
                <Icon name="smile" size="18" />
                Feeling
              </button>
            </div>
          </div>
        </ClientOnly>

        <!-- Posts Feed -->
        <ClientOnly>
          <div v-if="postsLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <div v-else-if="posts.length > 0" class="posts-list">
            <article 
              v-for="post in posts" 
              :key="post.id" 
              class="feed-post"
            >
              <div class="post-header">
                <img 
                  :src="post.author?.avatar_url || '/default-avatar.svg'" 
                  :alt="post.author?.full_name" 
                  class="post-avatar"
                />
                <div class="post-author-info">
                  <h4 class="post-author-name">{{ post.author?.full_name }}</h4>
                  <p class="post-author-username">@{{ post.author?.username }}</p>
                  <span class="post-timestamp">{{ formatTime(post.created_at) }}</span>
                </div>
              </div>

              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                <img 
                  v-if="post.media && post.media.length > 0" 
                  :src="post.media[0]" 
                  :alt="post.content" 
                  class="post-image"
                />
              </div>

              <div class="post-stats">
                <span class="stat">{{ post.likes_count || 0 }} Likes</span>
                <span class="stat">{{ post.comments_count || 0 }} Comments</span>
                <span class="stat">{{ post.shares_count || 0 }} Shares</span>
              </div>

              <div class="post-actions">
                <button class="action-btn" @click="likePost(post.id)">
                  <Icon name="heart" size="18" />
                  Like
                </button>
                <button class="action-btn" @click="commentPost(post.id)">
                  <Icon name="message-circle" size="18" />
                  Comment
                </button>
                <button class="action-btn" @click="sharePost(post.id)">
                  <Icon name="share-2" size="18" />
                  Share
                </button>
              </div>
            </article>

            <!-- Load More Button -->
            <div v-if="hasMorePosts" class="load-more">
              <button @click="loadMorePosts" class="btn-load-more">
                Load More Posts
              </button>
            </div>
          </div>

          <div v-else class="no-posts">
            <Icon name="inbox" size="48" />
            <h3>No posts yet</h3>
            <p>Start following people to see their posts!</p>
            <NuxtLink to="/explore" class="btn-explore">
              Explore People
            </NuxtLink>
          </div>
        </ClientOnly>
      </section>

      <!-- Right Sidebar - Recommendations & Trending -->
      <ClientOnly>
        <aside class="feed-sidebar-right">
          <!-- Suggested Users Card -->
          <div class="recommendations-card">
            <h3 class="card-title">Suggested For You</h3>
            <div v-if="suggestedUsersLoading" class="loading-small">
              <div class="spinner-small"></div>
            </div>
            <div v-else-if="suggestedUsers.length > 0" class="recommendations-list">
              <div 
                v-for="user in suggestedUsers" 
                :key="user.id" 
                class="recommendation-item"
              >
                <img 
                  :src="user.avatar_url || '/default-avatar.svg'" 
                  :alt="user.full_name" 
                  class="rec-avatar"
                />
                <div class="rec-info">
                  <h4 class="rec-name">{{ user.full_name }}</h4>
                  <p class="rec-username">@{{ user.username }}</p>
                </div>
                <button class="btn-follow" @click="followUser(user.id)">
                  Follow
                </button>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <p>No suggestions available</p>
            </div>
          </div>

          <!-- Trending Card -->
          <div class="trending-card">
            <h3 class="card-title">Trending</h3>
            <div v-if="trendingLoading" class="loading-small">
              <div class="spinner-small"></div>
            </div>
            <div v-else-if="trendingTopics.length > 0" class="trending-list">
              <div 
                v-for="trend in trendingTopics" 
                :key="trend.id" 
                class="trending-item"
              >
                <div class="trend-info">
                  <p class="trend-category">{{ trend.category }}</p>
                  <h4 class="trend-title">{{ trend.title }}</h4>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <p>No trending topics</p>
            </div>
          </div>
        </aside>
      </ClientOnly>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useFetchWithAuth } from '~/composables/use-fetch'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const fetchWithAuth = useFetchWithAuth()

// ============================================================================
// REACTIVE STATE
// ============================================================================
const posts = ref([])
const postsLoading = ref(true)
const hasMorePosts = ref(true)
const currentPage = ref(1)

const suggestedUsers = ref([])
const suggestedUsersLoading = ref(false)

const trendingTopics = ref([])
const trendingLoading = ref(false)

const unreadNotifications = ref(0)

// ============================================================================
// COMPUTED PROPERTIES - USER DATA FROM AUTH STORE
// ============================================================================
const currentUser = computed(() => authStore.user)
const userName = computed(() => currentUser.value?.full_name || 'User')
const userUsername = computed(() => currentUser.value?.username || 'username')
const userAvatar = computed(() => currentUser.value?.avatar_url || '/default-avatar.svg')
const userFollowers = computed(() => currentUser.value?.followers_count || 0)
const userFollowing = computed(() => currentUser.value?.following_count || 0)
const userPosts = computed(() => currentUser.value?.posts_count || 0)

// ============================================================================
// METHODS
// ============================================================================
const goToProfile = () => {
  console.log('[Feed] Go to profile')
  router.push(`/profile/${userUsername.value}`)
}

const goToCreatePost = () => {
  console.log('[Feed] Go to create post')
  router.push('/posts/create')
}

const likePost = async (postId: string) => {
  try {
    console.log('[Feed] Liking post:', postId)
    await fetchWithAuth(`/api/posts/${postId}/like`, {
      method: 'POST'
    })
    // Update UI - find post and increment likes
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.likes_count = (post.likes_count || 0) + 1
    }
  } catch (error) {
    console.error('[Feed] Error liking post:', error)
  }
}

const commentPost = (postId: string) => {
  console.log('[Feed] Comment on post:', postId)
  router.push(`/posts/${postId}/comments`)
}

const sharePost = async (postId: string) => {
  try {
    console.log('[Feed] Sharing post:', postId)
    await fetchWithAuth(`/api/posts/${postId}/share`, {
      method: 'POST'
    })
    // Update UI - find post and increment shares
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.shares_count = (post.shares_count || 0) + 1
    }
  } catch (error) {
    console.error('[Feed] Error sharing post:', error)
  }
}

const followUser = async (userId: string) => {
  try {
    console.log('[Feed] Following user:', userId)
    await fetchWithAuth(`/api/users/${userId}/follow`, {
      method: 'POST'
    })
    // Remove from suggested users
    suggestedUsers.value = suggestedUsers.value.filter(u => u.id !== userId)
  } catch (error) {
    console.error('[Feed] Error following user:', error)
  }
}

const loadMorePosts = async () => {
  console.log('[Feed] Load more posts')
  currentPage.value++
  await fetchPosts()
}

const formatTime = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

// ============================================================================
// FETCH DATA WITH AUTH TOKEN
// ============================================================================
const fetchPosts = async () => {
  try {
    console.log('[Feed] Fetching posts, page:', currentPage.value)
    
    const result = await fetchWithAuth('/api/posts/feed', {
      query: {
        page: currentPage.value,
        limit: 10
      }
    })

    if (currentPage.value === 1) {
      posts.value = result.posts || []
    } else {
      posts.value.push(...(result.posts || []))
    }

    hasMorePosts.value = result.has_more || false
    console.log('[Feed] Posts loaded:', posts.value.length)
  } catch (error) {
    console.error('[Feed] Error loading posts:', error)
    posts.value = []
  } finally {
    postsLoading.value = false
  }
}

const fetchSuggestedUsers = async () => {
  try {
    console.log('[Feed] Fetching suggested users')
    suggestedUsersLoading.value = true
    
    const result = await fetchWithAuth('/api/users/suggested', {
      query: { limit: 5 }
    })

    suggestedUsers.value = result.data || []
    console.log('[Feed] Suggested users loaded:', suggestedUsers.value.length)
  } catch (error) {
    console.error('[Feed] Error loading suggested users:', error)
    suggestedUsers.value = []
  } finally {
    suggestedUsersLoading.value = false
  }
}

const fetchTrendingTopics = async () => {
  try {
    console.log('[Feed] Fetching trending topics')
    trendingLoading.value = true
    
    const result = await fetchWithAuth('/api/trending', {
      query: { limit: 5 }
    })

    trendingTopics.value = result.data || []
    console.log('[Feed] Trending topics loaded:', trendingTopics.value.length)
  } catch (error) {
    console.error('[Feed] Error loading trending topics:', error)
    trendingTopics.value = []
  } finally {
    trendingLoading.value = false
  }
}

const fetchNotifications = async () => {
  try {
    console.log('[Feed] Fetching notifications')
    
    const result = await fetchWithAuth('/api/user/notifications', {
      query: { limit: 10 }
    })

    unreadNotifications.value = result.total || 0
    console.log('[Feed] Unread notifications:', unreadNotifications.value)
  } catch (error) {
    console.error('[Feed] Error loading notifications:', error)
    unreadNotifications.value = 0
  }
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================
onBeforeMount(() => {
  console.log('[Feed] Before mount - checking auth')
  
  if (!authStore.user || !authStore.token) {
    console.warn('[Feed] User not authenticated, redirecting to signin')
    router.push('/auth/signin')
  }
})

onMounted(async () => {
  console.log('[Feed] Component mounted')
  
  if (process.client) {
    console.log('[Feed] Loading data on client-side')
    
    // Load all data in parallel
    await Promise.all([
      fetchPosts(),
      fetchSuggestedUsers(),
      fetchTrendingTopics(),
      fetchNotifications()
    ])

    console.log('[Feed] All data loaded')
  }
})
</script>

<style scoped>
.feed-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0f172a;
  color: #e2e8f0;
}

.feed-main {
  display: grid;
  grid-template-columns: 300px 1fr 320px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
  flex: 1;
}

@media (max-width: 1200px) {
  .feed-main {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .feed-sidebar-left,
  .feed-sidebar-right {
    display: none;
  }
}

/* Left Sidebar */
.feed-sidebar-left {
  position: sticky;
  top: 80px;
  height: fit-content;
}

.profile-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
}

.profile-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem 0;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.btn-edit-profile {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.btn-edit-profile:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

/* Center Feed */
.feed-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.create-post-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
}

.create-post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.create-post-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.create-post-input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 24px;
  padding: 0.75rem 1rem;
  color: #e2e8f0;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.create-post-input:focus {
  border-color: #3b82f6;
  background: #1e293b;
}

.create-post-input::placeholder {
  color: #64748b;
}

.create-post-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

/* Posts List */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feed-post {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.feed-post:hover {
  border-color: #475569;
  background: #1e293b;
}

.post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.post-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.post-author-info {
  flex: 1;
}

.post-author-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.post-author-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.post-timestamp {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.post-content {
  margin-bottom: 1rem;
}

.post-text {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e2e8f0;
}

.post-image {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: cover;
}

.post-stats {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  font-size: 0.875rem;
  color: #94a3b8;
}

.post-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
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

.btn-load-more:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.no-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #94a3b8;
}

.no-posts h3 {
  margin: 1rem 0 0.5rem 0;
  color: #e2e8f0;
}

.btn-explore {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-explore:hover {
  background: #2563eb;
}

/* Right Sidebar */
.feed-sidebar-right {
  position: sticky;
  top: 80px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.recommendations-card,
.trending-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
}

.card-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
}

.recommendations-list,
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #0f172a;
  border-radius: 8px;
  transition: all 0.2s;
}

.recommendation-item:hover {
  background: #1e293b;
}

.rec-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-follow {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-follow:hover {
  background: #2563eb;
}

.trending-item {
  padding: 0.75rem;
  background: #0f172a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-item:hover {
  background: #1e293b;
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.trend-category {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
}

.trend-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f1f5f9;
}

.trend-count {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.loading-small {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state-small {
  text-align: center;
  padding: 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
