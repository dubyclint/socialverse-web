<template>
  <div class="feed-container">
    <!-- ============================================================================ -->
    <!-- HEADER SECTION (MERGED FROM /components/layout/Header.vue) -->
    <!-- ============================================================================ -->
    <header class="modern-header">
      <!-- Top Navigation Bar -->
      <div class="header-top">
        <!-- Left Side - Menu & Logo -->
        <div class="header-left">
          <button @click="toggleSidebar" class="menu-btn">
            <Icon name="menu" size="20" />
          </button>
          <NuxtLink to="/feed" class="logo">
            <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
            <span class="logo-text">SocialVerse</span>
          </NuxtLink>
        </div>

        <!-- Center - Navigation Icons -->
        <div class="header-center">
          <!-- Home/Feed Link -->
          <NuxtLink to="/feed" class="nav-icon" :class="{ active: $route.path === '/feed' }">
            <Icon name="home" size="24" />
            <span class="nav-label">Feed</span>
          </NuxtLink>

          <!-- Chat Link -->
          <NuxtLink to="/chat" class="nav-icon" :class="{ active: $route.path === '/chat' }">
            <Icon name="message-circle" size="24" />
            <span class="nav-label">Chat</span>
            <span v-if="unreadMessages > 0" class="notification-badge">{{ unreadMessages }}</span>
          </NuxtLink>

          <!-- Posts Link -->
          <NuxtLink to="/posts" class="nav-icon" :class="{ active: $route.path === '/posts' }">
            <Icon name="plus-square" size="24" />
            <span class="nav-label">Post</span>
          </NuxtLink>

          <!-- Live Stream Link -->
          <NuxtLink to="/streaming" class="nav-icon" :class="{ active: $route.path === '/streaming' }">
            <Icon name="radio" size="24" />
            <span class="nav-label">Live</span>
            <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
          </NuxtLink>

          <!-- Explore Link -->
          <NuxtLink to="/explore" class="nav-icon" :class="{ active: $route.path === '/explore' }">
            <Icon name="compass" size="24" />
            <span class="nav-label">Explore</span>
          </NuxtLink>
        </div>

        <!-- Right Side - User & Wallet -->
        <div class="header-right">
          <div class="wallet-info">
            <Icon name="wallet" size="20" />
            <span class="wallet-balance">${{ walletBalance.toFixed(2) }}</span>
          </div>
          <div class="user-avatar-wrapper">
            <img :src="user.avatar" :alt="user.name" class="user-avatar" />
            <span class="status-indicator" :class="user.status"></span>
          </div>
        </div>
      </div>
    </header>

    <!-- ============================================================================ -->
    <!-- MAIN FEED LAYOUT (3-COLUMN: LEFT SIDEBAR + CENTER FEED + RIGHT SIDEBAR) -->
    <!-- ============================================================================ -->
    <main class="feed-main">
      <div class="feed-layout">
        <!-- LEFT SIDEBAR - User Profile Card (FROM mainfeed.vue) -->
        <aside class="left-sidebar">
          <div class="user-card sticky-card">
            <!-- User Avatar -->
            <div class="user-card-header">
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.name"
                class="user-card-avatar"
              />
              <div v-else class="user-card-avatar-placeholder">
                {{ user.name?.charAt(0) || 'U' }}
              </div>
            </div>

            <!-- User Info -->
            <div class="user-card-info">
              <h3 class="user-card-name">{{ user.name }}</h3>
              <p class="user-card-username">@{{ user.username }}</p>
            </div>

            <!-- User Stats (FROM mainfeed.vue) -->
            <div class="user-stats">
              <div class="stat">
                <p class="stat-value">{{ userStats.followers }}</p>
                <p class="stat-label">Followers</p>
              </div>
              <div class="stat">
                <p class="stat-value">{{ userStats.following }}</p>
                <p class="stat-label">Following</p>
              </div>
              <div class="stat">
                <p class="stat-value">{{ userStats.posts }}</p>
                <p class="stat-label">Posts</p>
              </div>
            </div>

            <!-- Quick Links (FROM mainfeed.vue) -->
            <div class="quick-links">
              <NuxtLink to="/profile" class="quick-link-btn primary">
                View Profile
              </NuxtLink>
              <NuxtLink to="/settings" class="quick-link-btn secondary">
                Settings
              </NuxtLink>
            </div>
          </div>
        </aside>

        <!-- CENTER - Main Feed -->
        <section class="center-feed">
          <!-- Create Post Section -->
          <div class="create-post-card">
            <div class="create-post-header">
              <img :src="currentUserAvatar" :alt="currentUserName" class="create-post-avatar" />
              <input
                type="text"
                placeholder="What's on your mind?"
                @click="showCreatePostModal = true"
                class="create-post-input"
              />
            </div>
            <div class="create-post-actions">
              <button @click="showCreatePostModal = true" class="action-btn">
                <Icon name="image" size="18" />
                Photo
              </button>
              <button @click="showCreatePostModal = true" class="action-btn">
                <Icon name="video" size="18" />
                Video
              </button>
              <button @click="showCreatePostModal = true" class="action-btn">
                <Icon name="smile" size="18" />
                Feeling
              </button>
            </div>
          </div>

          <!-- Posts Feed -->
          <div v-if="loading && posts.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
            <button @click="retryLoadPosts" class="retry-btn">Retry</button>
          </div>

          <div v-else class="posts-list">
            <!-- Posts Container (MERGED FROM feed.vue + istfeed.vue) -->
            <article
              v-for="post in posts"
              :key="post.id"
              class="post-card"
              :class="[post.type, { 'sponsored': post.sponsored, 'ad': post.isAd }]"
            >
              <!-- Post Header -->
              <div class="post-header">
                <div class="post-author-info">
                  <img :src="post.user_avatar" :alt="post.user_name" class="post-avatar" />
                  <div class="post-author-details">
                    <h4 class="post-author-name">{{ post.user_name }}</h4>
                    <span class="post-time">{{ formatDate(post.created_at) }}</span>
                  </div>
                </div>
                <button @click="togglePostOptions(post.id)" class="post-options-btn">
                  <Icon name="more-vertical" size="20" />
                </button>
              </div>

              <!-- Post Content -->
              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>

                <!-- Post Media -->
                <div v-if="post.media && post.media.length > 0" class="post-media">
                  <img
                    v-for="(media, index) in post.media"
                    :key="index"
                    :src="media.url"
                    :alt="post.content"
                    class="post-image"
                    @click="openMediaViewer(media.url)"
                  />
                </div>
              </div>

              <!-- Engagement Stats -->
              <div class="engagement-stats">
                <span class="stat">{{ post.likes_count }} Likes</span>
                <span class="stat">{{ post.comments_count }} Comments</span>
                <span class="stat">{{ post.shares_count }} Shares</span>
              </div>

              <!-- Post Actions (MERGED FROM feed.vue + istfeed.vue) -->
              <div class="post-actions">
                <button
                  @click="likePost(post.id)"
                  :class="['action-btn', { liked: post.liked }]"
                >
                  <Icon name="heart" size="18" />
                  Like
                </button>
                <button @click="toggleComments(post.id)" class="action-btn">
                  <Icon name="message-circle" size="18" />
                  Comment
                </button>
                <button @click="sharePost(post)" class="action-btn">
                  <Icon name="share-2" size="18" />
                  Share
                </button>
                <button @click="openPewGiftModal(post)" class="action-btn pew-gift">
                  <Icon name="gift" size="18" />
                  Pew Gift
                </button>
              </div>

              <!-- Comments Section (FROM istfeed.vue) -->
              <div v-if="expandedComments.includes(post.id)" class="comments-section">
                <div class="comments-list">
                  <div
                    v-for="comment in post.comments"
                    :key="comment.id"
                    class="comment-item"
                  >
                    <img :src="comment.user_avatar" :alt="comment.user_name" class="comment-avatar" />
                    <div class="comment-content">
                      <h5 class="comment-author">{{ comment.user_name }}</h5>
                      <p class="comment-text">{{ comment.content }}</p>
                      <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Add Comment -->
                <div class="add-comment">
                  <img :src="currentUserAvatar" :alt="currentUserName" class="comment-avatar" />
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    class="comment-input"
                    @keydown.enter="addComment(post.id, $event)"
                  />
                </div>
              </div>
            </article>

            <!-- Load More -->
            <div v-if="hasMore" class="load-more">
              <button @click="loadMorePosts" :disabled="loading" class="load-more-btn">
                {{ loading ? 'Loading...' : 'Load More Posts' }}
              </button>
            </div>
          </div>
        </section>

        <!-- RIGHT SIDEBAR - Trending & Suggestions (FROM mainfeed.vue) -->
        <aside class="right-sidebar">
          <!-- Trending Topics -->
          <div class="trending-card sticky-card">
            <h3 class="sidebar-title">🔥 Trending</h3>
            <div class="trending-list">
              <div
                v-for="trend in trending"
                :key="trend.id"
                class="trending-item"
              >
                <p class="trending-tag">#{{ trend.tag }}</p>
                <p class="trending-count">{{ trend.count }} posts</p>
              </div>
            </div>
          </div>

          <!-- User Suggestions (FROM mainfeed.vue) -->
          <div class="suggestions-card sticky-card">
            <h3 class="sidebar-title">👥 Suggestions</h3>
            <div class="suggestions-list">
              <div
                v-for="suggestion in suggestions"
                :key="suggestion.id"
                class="suggestion-item"
              >
                <div class="suggestion-user-info">
                  <img
                    v-if="suggestion.avatar_url"
                    :src="suggestion.avatar_url"
                    :alt="suggestion.full_name"
                    class="suggestion-avatar"
                  />
                  <div v-else class="suggestion-avatar-placeholder">
                    {{ suggestion.full_name?.charAt(0) || 'U' }}
                  </div>
                  <div>
                    <p class="suggestion-name">{{ suggestion.full_name }}</p>
                    <p class="suggestion-username">@{{ suggestion.username }}</p>
                  </div>
                </div>
                <button
                  @click="handleFollowUser(suggestion.id)"
                  class="follow-btn"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Pew Gift Modal (FROM istfeed.vue) -->
    <div v-if="showPewGiftModal" class="modal-overlay" @click="closePewGiftModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Send Pew Gift</h2>
          <button @click="closePewGiftModal" class="close-btn">
            <Icon name="x" size="20" />
          </button>
        </div>

        <div class="modal-body">
          <p class="gift-message">Send a gift to {{ selectedPost?.user_name }}</p>

          <!-- Quick Gift Amounts -->
          <div class="gift-amounts">
            <button
              v-for="amount in quickGiftAmounts"
              :key="amount"
              @click="selectedGiftAmount = amount"
              :class="['gift-btn', { selected: selectedGiftAmount === amount }]"
            >
              ${{ amount }}
            </button>
          </div>

          <!-- Custom Amount -->
          <div class="custom-amount">
            <label>Custom Amount</label>
            <input
              v-model.number="customGiftAmount"
              type="number"
              placeholder="Enter amount"
              min="1"
            />
          </div>

          <!-- Gift Preview -->
          <div v-if="giftPreview" class="gift-preview">
            <p>Gift Amount: ${{ giftPreview.amount }}</p>
            <p>Platform Fee (5%): ${{ giftPreview.platformFee.toFixed(2) }}</p>
            <p class="total">Total: ${{ giftPreview.total.toFixed(2) }}</p>
          </div>

          <!-- Send Button -->
          <button
            @click="sendPewGift"
            :disabled="sendingGift || !getSelectedGiftAmount()"
            class="send-gift-btn"
          >
            {{ sendingGift ? 'Sending...' : 'Send Gift' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { ref, computed, onMounted } from 'vue'
const authStore = useAuthStore()
const { fetchFeed, fetchTrending, fetchSuggestions } = usePostFeed()

// ============================================================================
// HEADER STATE
// ============================================================================
const unreadMessages = ref(3)
const walletBalance = ref(1250.50)
const isLiveStreaming = ref(false)

// ============================================================================
// USER DATA (MERGED FROM feed.vue + mainfeed.vue)
// ============================================================================
const user = computed(() => ({
  name: authStore.userDisplayName,
  username: authStore.profile?.username || 'user',
  avatar: authStore.profile?.avatar_url || '/default-avatar.png',
  status: 'online'
}))

const currentUserAvatar = computed(() => authStore.profile?.avatar_url || '/default-avatar.png')
const currentUserName = computed(() => authStore.userDisplayName || 'You')

// ============================================================================
// FEED STATE (MERGED FROM feed.vue + mainfeed.vue + istfeed.vue)
// ============================================================================
const posts = ref([])
const loading = ref(false)
const error = ref(null)
const hasMore = ref(true)
const currentPage = ref(1)

const showCreatePostModal = ref(false)
const showPewGiftModal = ref(false)
const selectedPost = ref(null)
const selectedGiftAmount = ref(null)
const customGiftAmount = ref(null)
const sendingGift = ref(false)

const trending = ref([])
const suggestions = ref([])
const expandedComments = ref([])

const userStats = ref({
  followers: 0,
  following: 0,
  posts: 0
})

const quickGiftAmounts = [1, 5, 10, 25, 50]

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================
const giftPreview = computed(() => {
  const amount = getSelectedGiftAmount()
  if (!amount) return null

  const platformFee = amount * 0.05
  const total = amount + platformFee

  return {
    amount,
    platformFee,
    total
  }
})

// ============================================================================
// METHODS - FEED MANAGEMENT
// ============================================================================
const loadFeed = async () => {
  try {
    loading.value = true
    error.value = null
    currentPage.value = 1

    const [feedData, trendingData, suggestionsData] = await Promise.all([
      fetchFeed(currentPage.value),
      fetchTrending(),
      fetchSuggestions()
    ])

    posts.value = feedData
    trending.value = trendingData
    suggestions.value = suggestionsData
  } catch (err) {
    console.error('Error loading feed:', err)
    error.value = 'Failed to load feed. Please try again.'
  } finally {
    loading.value = false
  }
}

const loadMorePosts = async () => {
  try {
    loading.value = true
    currentPage.value++

    const moreData = await fetchFeed(currentPage.value)
    if (moreData.length === 0) {
      hasMore.value = false
    } else {
      posts.value.push(...moreData)
    }
  } catch (err) {
    console.error('Error loading more posts:', err)
  } finally {
    loading.value = false
  }
}

const retryLoadPosts = () => {
  loadFeed()
}

// ============================================================================
// METHODS - POST INTERACTIONS (MERGED FROM feed.vue + istfeed.vue)
// ============================================================================
const likePost = async (postId) => {
  const post = posts.value.find(p => p.id === postId)
  if (!post) return

  try {
    post.liked = !post.liked
    post.likes_count += post.liked ? 1 : -1
    // TODO: Call API to persist like
  } catch (err) {
    console.error('Error liking post:', err)
    post.liked = !post.liked
    post.likes_count += post.liked ? -1 : 1
  }
}

const toggleComments = (postId) => {
  const index = expandedComments.value.indexOf(postId)
  if (index > -1) {
    expandedComments.value.splice(index, 1)
  } else {
    expandedComments.value.push(postId)
  }
}

const addComment = async (postId, event) => {
  const input = event.target
  const content = input.value.trim()

  if (!content) return

  try {
    const post = posts.value.find(p => p.id === postId)
    if (!post) return

    // TODO: Call API to add comment
    post.comments_count++
    input.value = ''
  } catch (err) {
    console.error('Error adding comment:', err)
  }
}

const sharePost = async (post) => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post on SocialVerse',
        text: post.content,
        url: window.location.href
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
    post.shares_count++
  } catch (err) {
    console.error('Error sharing post:', err)
  }
}

const togglePostOptions = (postId) => {
  // TODO: Implement post options menu
  console.log('Post options for:', postId)
}

const openMediaViewer = (mediaUrl) => {
  // TODO: Implement media viewer
  console.log('Opening media:', mediaUrl)
}

// ============================================================================
// METHODS - PEW GIFT (FROM istfeed.vue)
// ============================================================================
const openPewGiftModal = (post) => {
  selectedPost.value = post
  selectedGiftAmount.value = null
  customGiftAmount.value = null
  showPewGiftModal.value = true
}

const closePewGiftModal = () => {
  showPewGiftModal.value = false
  selectedPost.value = null
}

const getSelectedGiftAmount = () => {
  return customGiftAmount.value || selectedGiftAmount.value
}

const sendPewGift = async () => {
  const amount = getSelectedGiftAmount()
  if (!amount || !selectedPost.value) return

  try {
    sendingGift.value = true
    // TODO: Call API to send gift
    alert(`Gift of $${amount} sent successfully!`)
    closePewGiftModal()
  } catch (err) {
    console.error('Error sending gift:', err)
    alert('Error sending gift')
  } finally {
    sendingGift.value = false
  }
}

// ============================================================================
// METHODS - SIDEBAR INTERACTIONS (FROM mainfeed.vue)
// ============================================================================
const handleFollowUser = (userId) => {
  // TODO: Implement follow logic
  console.log('Following user:', userId)
}

const toggleSidebar = () => {
  // TODO: Implement sidebar toggle for mobile
  console.log('Toggle sidebar')
}

// ============================================================================
// UTILITY METHODS
// ============================================================================
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return d.toLocaleDateString()
}

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(() => {
  loadFeed()
})
</script>

<style scoped>
/* ============================================================================ */
/* HEADER STYLES */
/* ============================================================================ */
.feed-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f172a;
}

.modern-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
}

.logo-img {
  height: 32px;
  width: 32px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  font-size: 0.75rem;
}

.nav-icon:hover {
  color: white;
}

.nav-icon.active {
  color: white;
  border-bottom: 3px solid white;
  padding-bottom: 0.25rem;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

.notification-badge.live {
  background: #dc2626;
  font-size: 0.6rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  font-weight: 600;
}

.user-avatar-wrapper {
  position: relative;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3b82f6;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #1e293b;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.away {
  background: #f59e0b;
}

.status-indicator.busy {
  background: #ef4444;
}

.status-indicator.offline {
  background: #6b7280;
}

/* ============================================================================ */
/* MAIN FEED LAYOUT */
/* ============================================================================ */
.feed-main {
  flex: 1;
  overflow-y: auto;
}

.feed-layout {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

@media (max-width: 1200px) {
  .feed-layout {
    grid-template-columns: 1fr;
  }

  .left-sidebar,
  .right-sidebar {
    display: none;
  }
}

/* ============================================================================ */
/* LEFT SIDEBAR - USER PROFILE CARD */
/* ============================================================================ */
.left-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sticky-card {
  position: sticky;
  top: 100px;
}

.user-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
}

.user-card-header {
  height: 100px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1rem;
}

.user-card-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #1e293b;
}

.user-card-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  border: 3px solid #1e293b;
}

.user-card-info {
  padding: 1rem;
  text-align: center;
}

.user-card-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.user-card-username {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
}

.user-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
}

.stat {
  padding: 1rem;
  text-align: center;
  border-right: 1px solid #334155;
}

.stat:last-child {
  border-right: none;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #3b82f6;
  margin: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.quick-link-btn {
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
}

.quick-link-btn.primary {
  background: #3b82f6;
  color: white;
}

.quick-link-btn.primary:hover {
  background: #2563eb;
}

.quick-link-btn.secondary {
  background: #475569;
  color: white;
}

.quick-link-btn.secondary:hover {
  background: #64748b;
}

/* ============================================================================ */
/* CENTER FEED */
/* ============================================================================ */
.center-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-post-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
}

.create-post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.create-post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.create-post-input {
  flex: 1;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 20px;
  padding: 0.75rem 1rem;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
}

.create-post-input:hover,
.create-post-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: #475569;
}

.create-post-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 6px;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-btn.liked {
  color: #ef4444;
}

.action-btn.pew-gift {
  color: #f59e0b;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #2563eb;
}

/* ============================================================================ */
/* POST CARD */
/* ============================================================================ */
.post-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.post-card:hover {
  border-color: #475569;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #334155;
}

.post-author-info {
  display: flex;
  gap: 0.75rem;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-author-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.post-author-name {
  font-weight: 600;
  color: white;
  margin: 0;
  font-size: 0.95rem;
}

.post-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

.post-options-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.3s;
}

.post-options-btn:hover {
  color: white;
}

.post-content {
  padding: 1rem;
}

.post-text {
  color: white;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.post-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.post-image:hover {
  opacity: 0.9;
}

.engagement-stats {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  font-size: 0.85rem;
  color: #94a3b8;
}

.engagement-stats .stat {
  padding: 0;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
}

.post-actions .action-btn {
  flex: 1;
  justify-content: center;
}

/* ============================================================================ */
/* COMMENTS SECTION */
/* ============================================================================ */
.comments-section {
  padding: 1rem;
  background: rgba(51, 65, 85, 0.3);
  border-top: 1px solid #334155;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.comment-item {
  display: flex;
  gap: 0.75rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-author {
  font-weight: 600;
  color: white;
  margin: 0;
  font-size: 0.9rem;
}

.comment-text {
  color: #cbd5e1;
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.add-comment {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.comment-input {
  flex: 1;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  color: white;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.comment-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.load-more-btn {
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.load-more-btn:hover:not(:disabled) {
  background: #2563eb;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============================================================================ */
/* RIGHT SIDEBAR - TRENDING & SUGGESTIONS */
/* ============================================================================ */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trending-card,
.suggestions-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 1rem 0;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trending-item {
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.trending-item:hover {
  background: rgba(59, 130, 246, 0.2);
}

.trending-tag {
  font-weight: 600;
  color: #3b82f6;
  margin: 0;
  font-size: 0.95rem;
}

.trending-count {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 6px;
}

.suggestion-user-info {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.suggestion-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.suggestion-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
}

.suggestion-name {
  font-weight: 600;
  color: white;
  margin: 0;
  font-size: 0.9rem;
}

.suggestion-username {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
}

.follow-btn {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.follow-btn:hover {
  background: #2563eb;
}

/* ============================================================================ */
/* MODAL STYLES */
/* ============================================================================ */
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
  background: #1e293b;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  border: 1px solid #334155;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gift-message {
  color: #cbd5e1;
  margin: 0;
  text-align: center;
}

.gift-amounts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.gift-btn {
  padding: 0.75rem;
  background: #334155;
  border: 2px solid transparent;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.gift-btn:hover {
  border-color: #3b82f6;
}

.gift-btn.selected {
  background: #3b82f6;
  border-color: #3b82f6;
}

.custom-amount {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-amount label {
  color: #cbd5e1;
  font-weight: 600;
  font-size: 0.9rem;
}

.custom-amount input {
  padding: 0.75rem;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 6px;
  color: white;
  font-size: 0.95rem;
}

.custom-amount input:focus {
  outline: none;
  border-color: #3b82f6;
}

.gift-preview {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 1rem;
  color: #cbd5e1;
}

.gift-preview p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.gift-preview .total {
  font-weight: 600;
  color: #3b82f6;
  font-size: 1.1rem;
  margin-top: 0.75rem;
}

.send-gift-btn {
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.send-gift-btn:hover:not(:disabled) {
  background: #2563eb;
}

.send-gift-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============================================================================ */
/* RESPONSIVE DESIGN */
/* ============================================================================ */
@media (max-width: 768px) {
  .header-top {
    padding: 0.75rem 1rem;
  }

  .header-center {
    gap: 1rem;
  }

  .nav-label {
    display: none;
  }

  .feed-layout {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .left-sidebar,
  .right-sidebar {
    display: none;
  }
}
</style>

