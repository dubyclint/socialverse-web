<!-- COMPLETE UPDATED: /pages/feed.vue -->
<!-- Integrated with all FeedHeader.vue features -->
<template>
  <div class="feed-page">
    <!-- HEADER SECTION - Integrated from FeedHeader.vue -->
    <header class="feed-header">
      <div class="header-top">
        <!-- Left Side - Menu & Logo -->
        <div class="header-left">
          <button @click="toggleSidebar" class="menu-btn" aria-label="Toggle menu">
            <Icon name="menu" size="20" />
          </button>
          <NuxtLink to="/feed" class="logo">
            <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
            <span class="logo-text">SocialVerse</span>
          </NuxtLink>
        </div>

        <!-- Center - Navigation Icons -->
        <nav class="header-center">
          <NuxtLink 
            to="/feed" 
            class="nav-icon" 
            :class="{ active: route.path === '/feed' }"
            aria-label="Feed"
          >
            <Icon name="home" size="24" />
            <span class="nav-label">Feed</span>
          </NuxtLink>

          <NuxtLink 
            to="/posts/create" 
            class="nav-icon" 
            :class="{ active: route.path === '/posts/create' }"
            aria-label="Create Post"
          >
            <Icon name="plus-square" size="24" />
            <span class="nav-label">Post</span>
          </NuxtLink>

          <NuxtLink 
            to="/stream" 
            class="nav-icon" 
            :class="{ active: route.path === '/stream' }"
            aria-label="Live Stream"
          >
            <Icon name="radio" size="24" />
            <span class="nav-label">Live</span>
            <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
          </NuxtLink>

          <NuxtLink 
            to="/wallet" 
            class="nav-icon" 
            :class="{ active: route.path === '/wallet' }"
            aria-label="Wallet"
          >
            <Icon name="wallet" size="24" />
            <span class="nav-label">Wallet</span>
          </NuxtLink>
        </nav>

        <!-- Right Side - User Avatar -->
        <div class="header-right">
          <div class="user-avatar-wrapper">
            <img 
              :src="userAvatar" 
              :alt="userName" 
              class="user-avatar"
              @click="goToProfile"
            />
            <span class="status-indicator" :class="userStatus"></span>
          </div>
        </div>
      </div>

      <!-- Mobile Sidebar Overlay -->
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

      <!-- Sidebar Menu -->
      <aside :class="['sidebar', { open: sidebarOpen }]">
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button class="close-btn" @click="toggleSidebar">
            <Icon name="x" size="20" />
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- Profile -->
          <NuxtLink to="/profile" class="sidebar-item" @click="toggleSidebar">
            <Icon name="user" size="18" />
            <span>Profile</span>
          </NuxtLink>

          <!-- Chat -->
          <NuxtLink to="/chat" class="sidebar-item" @click="toggleSidebar">
            <Icon name="message-circle" size="18" />
            <span>Chat</span>
            <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          </NuxtLink>

          <!-- Explore -->
          <NuxtLink to="/explore" class="sidebar-item" @click="toggleSidebar">
            <Icon name="compass" size="18" />
            <span>Explore</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- P2P Feature -->
          <NuxtLink to="/p2p" class="sidebar-item" @click="toggleSidebar">
            <Icon name="trending-up" size="18" />
            <span>P2P Trading</span>
          </NuxtLink>

          <!-- Escrow Feature -->
          <NuxtLink to="/escrow" class="sidebar-item" @click="toggleSidebar">
            <Icon name="shield" size="18" />
            <span>Escrow</span>
          </NuxtLink>

          <!-- Monetization -->
          <NuxtLink to="/monetization" class="sidebar-item" @click="toggleSidebar">
            <Icon name="dollar-sign" size="18" />
            <span>Monetization</span>
          </NuxtLink>

          <!-- Ads Feature -->
          <NuxtLink to="/ads" class="sidebar-item" @click="toggleSidebar">
            <Icon name="megaphone" size="18" />
            <span>Ads</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- Agent Support -->
          <NuxtLink to="/support-chat" class="sidebar-item" @click="toggleSidebar">
            <Icon name="headphones" size="18" />
            <span>Agent Support</span>
          </NuxtLink>

          <!-- Policy & T&Cs -->
          <NuxtLink to="/terms-and-policy" class="sidebar-item" @click="toggleSidebar">
            <Icon name="file-text" size="18" />
            <span>Policy & T&Cs</span>
          </NuxtLink>

          <!-- Settings -->
          <NuxtLink to="/settings" class="sidebar-item" @click="toggleSidebar">
            <Icon name="settings" size="18" />
            <span>Settings</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- Logout -->
          <button class="sidebar-item logout-btn" @click="handleLogout">
            <Icon name="log-out" size="18" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </header>

    <!-- Main Feed Layout -->
    <main class="feed-main">
      <div class="feed-container">
        <!-- Left Sidebar - User Profile -->
        <aside class="left-sidebar">
          <UserProfileCard />
        </aside>

        <!-- Center - Feed Posts -->
        <section class="center-feed">
          <!-- Create Post Card -->
          <div class="create-post-card">
            <img 
              :src="currentUserAvatar" 
              :alt="currentUserName"
              class="create-post-avatar"
            />
            <input 
              type="text"
              placeholder="What's on your mind?"
              class="create-post-input"
              @click="showCreatePostModal = true"
            />
            <button class="create-post-btn" @click="showCreatePostModal = true">
              <Icon name="image" size="18" />
            </button>
          </div>

          <!-- Create Post Modal -->
          <div v-if="showCreatePostModal" class="modal-overlay" @click="showCreatePostModal = false">
            <div class="modal-content" @click.stop>
              <div class="modal-header">
                <h3>Create a Post</h3>
                <button class="close-btn" @click="showCreatePostModal = false">
                  <Icon name="x" size="20" />
                </button>
              </div>
              <div class="modal-body">
                <textarea 
                  v-model="newPostContent"
                  placeholder="What's on your mind?"
                  class="post-textarea"
                ></textarea>
                <input 
                  type="file"
                  accept="image/*"
                  class="post-image-input"
                  @change="handleImageUpload"
                />
                <button 
                  class="post-submit-btn"
                  @click="submitPost"
                  :disabled="!newPostContent.trim()"
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          <!-- Posts Feed -->
          <div class="posts-list">
            <FeedPost 
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <!-- Empty State -->
          <div v-if="!isLoading && posts.length === 0" class="empty-state">
            <Icon name="inbox" size="48" />
            <h3>No posts yet</h3>
            <p>Follow people to see their posts here</p>
          </div>
        </section>

        <!-- Right Sidebar - Trending/Suggestions -->
        <aside class="right-sidebar">
          <div class="sidebar-card">
            <h3 class="sidebar-title">Trending Now</h3>
            <div class="trending-list">
              <div v-for="trend in trendingTopics" :key="trend.id" class="trending-item">
                <div class="trend-info">
                  <p class="trend-category">{{ trend.category }}</p>
                  <h4 class="trend-title">{{ trend.title }}</h4>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-card">
            <h3 class="sidebar-title">Suggestions</h3>
            <div class="suggestions-list">
              <div v-for="user in suggestedUsers" :key="user.id" class="suggestion-item">
                <img :src="user.avatar" :alt="user.name" class="suggestion-avatar" />
                <div class="suggestion-info">
                  <h4 class="suggestion-name">{{ user.name }}</h4>
                  <p class="suggestion-handle">@{{ user.username }}</p>
                </div>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

// ===== TYPES =====
interface Post {
  id: string
  author: {
    id: string
    name: string
    username: string
    avatar: string
    verified: boolean
  }
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  liked: boolean
  createdAt: Date
  commentsList: any[]
}

interface TrendingTopic {
  id: string
  category: string
  title: string
  count: number
}

interface SuggestedUser {
  id: string
  name: string
  username: string
  avatar: string
}

// ===== STORES & ROUTER =====
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// ===== HEADER STATE (from FeedHeader.vue) =====
const sidebarOpen = ref(false)
const unreadMessages = ref(0)
const isLiveStreaming = ref(false)
const userStatus = ref('online')

// ===== HEADER COMPUTED PROPERTIES =====
const userName = computed(() => authStore.userDisplayName || 'User')
const userAvatar = computed(() => authStore.userAvatar || '/default-avatar.png')

// ===== FEED STATE =====
const showCreatePostModal = ref(false)
const isLoading = ref(false)
const newPostContent = ref('')

// ===== CURRENT USER DATA =====
const currentUserName = computed(() => authStore.userDisplayName || 'You')
const currentUserAvatar = computed(() => authStore.userAvatar || '/default-avatar.png')

// ===== POSTS DATA =====
const posts = reactive<Post[]>([
  {
    id: '1',
    author: {
      id: '1',
      name: 'Jane Smith',
      username: 'janesmith',
      avatar: '/default-avatar.png',
      verified: true
    },
    content: 'Just launched my new project! Check it out and let me know what you think 🚀',
    image: undefined,
    likes: 234,
    comments: 45,
    shares: 12,
    liked: false,
    createdAt: new Date(Date.now() - 3600000),
    commentsList: []
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Alex Johnson',
      username: 'alexjohnson',
      avatar: '/default-avatar.png',
      verified: false
    },
    content: 'Beautiful sunset today! Nature is amazing 🌅',
    image: undefined,
    likes: 567,
    comments: 89,
    shares: 34,
    liked: false,
    createdAt: new Date(Date.now() - 7200000),
    commentsList: []
  }
])

// ===== TRENDING TOPICS =====
const trendingTopics = reactive<TrendingTopic[]>([
  { id: '1', category: 'Technology', title: '#WebDevelopment', count: 45230 },
  { id: '2', category: 'Entertainment', title: '#MovieNight', count: 32145 },
  { id: '3', category: 'Sports', title: '#Football', count: 28934 },
  { id: '4', category: 'News', title: '#Breaking', count: 19283 }
])

// ===== SUGGESTED USERS =====
const suggestedUsers = reactive<SuggestedUser[]>([
  { id: '1', name: 'Sarah Wilson', username: 'sarahwilson', avatar: '/default-avatar.png' },
  { id: '2', name: 'Mike Brown', username: 'mikebrown', avatar: '/default-avatar.png' },
  { id: '3', name: 'Emma Davis', username: 'emmadavis', avatar: '/default-avatar.png' }
])

// ===== HEADER METHODS (from FeedHeader.vue) =====
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const goToProfile = () => {
  sidebarOpen.value = false
  router.push('/profile')
}

const handleLogout = async () => {
  sidebarOpen.value = false
  authStore.clearAuth()
  router.push('/auth/signin')
}

// ===== FEED METHODS =====
const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    console.log('Image uploaded:', file.name)
  }
}

const submitPost = () => {
  if (!newPostContent.value.trim()) return

  const newPost: Post = {
    id: Date.now().toString(),
    author: {
      id: authStore.user?.id || '1',
      name: currentUserName.value,
      username: authStore.user?.user_metadata?.username || 'yourname',
      avatar: currentUserAvatar.value,
      verified: false
    },
    content: newPostContent.value,
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    createdAt: new Date(),
    commentsList: []
  }

  posts.unshift(newPost)
  newPostContent.value = ''
  showCreatePostModal.value = false
}

// ===== LIFECYCLE HOOKS =====
onMounted(() => {
  console.log('Feed page mounted')
  console.log('Current user:', authStore.userDisplayName)
  console.log('Current avatar:', authStore.userAvatar)
  
  // Close sidebar on route change
  watch(() => route.path, () => {
    sidebarOpen.value = false
  })
})
</script>

<style scoped>
/* ===== PAGE LAYOUT ===== */
.feed-page {
  background: #0f172a;
  min-height: 100vh;
}

.feed-main {
  padding-top: 60px;
}

.feed-container {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

/* ===== HEADER STYLES (from FeedHeader.vue) ===== */
.feed-header {
  background: #0f172a;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 0 0 auto;
}

.menu-btn {
  background: none;
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #1e293b;
  color: #60a5fa;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  display: none;
}

@media (min-width: 768px) {
  .logo-text {
    display: inline;
  }
}

.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.nav-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
  font-size: 0.75rem;
}

.nav-icon:hover {
  color: #60a5fa;
  background: #1e293b;
}

.nav-icon.active {
  color: #60a5fa;
  background: #1e293b;
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 500;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  font-weight: 600;
}

.notification-badge.live {
  background: #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 0 0 auto;
}

.user-avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #334155;
  transition: all 0.2s;
}

.user-avatar:hover {
  border-color: #60a5fa;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #0f172a;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.away {
  background: #f59e0b;
}

.status-indicator.offline {
  background: #6b7280;
}

/* ===== SIDEBAR STYLES ===== */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: #0f172a;
  border-right: 1px solid #334155;
  overflow-y: auto;
  z-index: 101;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  padding-top: 60px;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #334155;
}

.sidebar-header h3 {
  margin: 0;
  color: white;
  font-size: 1.1rem;
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

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;
  position: relative;
}

.sidebar-item:hover {
  background: #1e293b;
  color: #60a5fa;
}

.sidebar-item.router-link-active {
  background: #1e293b;
  color: #60a5fa;
  border-left: 3px solid #60a5fa;
  padding-left: calc(1rem - 3px);
}

.sidebar-item.logout-btn {
  color: #ef4444;
  margin-top: auto;
}

.sidebar-item.logout-btn:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

.sidebar-divider {
  height: 1px;
  background: #334155;
  margin: 0.5rem 0;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 600;
  margin-left: auto;
}

/* ===== LEFT SIDEBAR ===== */
.left-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

/* ===== CENTER FEED ===== */
.center-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-post-card {
  display: flex;
  gap: 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
  align-items: center;
}

.create-post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.create-post-input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 0.75rem 1rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
}

.create-post-input:focus {
  border-color: #60a5fa;
  background: #1e293b;
}

.create-post-input::placeholder {
  color: #64748b;
}

.create-post-btn {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.create-post-btn:hover {
  background: #0f172a;
}

/* ===== MODAL STYLES ===== */
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
  width: 90%;
  max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
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

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-textarea {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  color: #e2e8f0;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  outline: none;
  transition: all 0.2s;
}

.post-textarea:focus {
  border-color: #60a5fa;
}

.post-textarea::placeholder {
  color: #64748b;
}

.post-image-input {
  color: #94a3b8;
}

.post-submit-btn {
  background: #60a5fa;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.post-submit-btn:hover:not(:disabled) {
  background: #3b82f6;
}

.post-submit-btn:disabled {
  background: #64748b;
  cursor: not-allowed;
  opacity: 0.5;
}

/* ===== POSTS LIST ===== */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

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
  border: 4px solid #334155;
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #94a3b8;
  text-align: center;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #e2e8f0;
}

/* ===== RIGHT SIDEBAR ===== */
.right-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
}

.sidebar-title {
  margin: 0 0 1rem;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trending-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-item:last-child {
  border-bottom: none;
}

.trending-item:hover {
  opacity: 0.8;
}

.trend-info {
  margin: 0;
}

.trend-category {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.trend-title {
  margin: 0.25rem 0;
  color: #e2e8f0;
  font-size: 0.95rem;
  font-weight: 600;
}

.trend-count {
  margin: 0.25rem 0 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #0f172a;
  border-radius: 8px;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: #1e293b;
}

.suggestion-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  margin: 0;
  color: #e2e8f0;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-handle {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-btn {
  background: #60a5fa;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.follow-btn:hover {
  background: #3b82f6;
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1024px) {
  .feed-container {
    grid-template-columns: 1fr 320px;
  }

  .left-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .feed-container {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .right-sidebar {
    display: none;
  }

  .header-center {
    display: none;
  }

  .feed-main {
    padding-top: 60px;
  }
}

@media (max-width: 480px) {
  .feed-header {
    padding: 0.5rem;
  }

  .header-top {
    gap: 0.5rem;
  }

  .create-post-card {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .create-post-avatar {
    width: 32px;
    height: 32px;
  }

  .sidebar-card {
    padding: 1rem;
  }
}
</style>
