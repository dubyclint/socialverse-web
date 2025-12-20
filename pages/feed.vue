<!-- COMPLETE UPDATED: /pages/feed.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     FEED PAGE - FIXED: All user-specific data wrapped in ClientOnly
     ✅ FIXED: User avatar and name wrapped
     ✅ FIXED: Notification badges wrapped
     ✅ FIXED: Live streaming badge wrapped
     ============================================================================ -->

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
            <!-- ✅ FIXED: Wrap live badge in ClientOnly -->
            <ClientOnly>
              <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
            </ClientOnly>
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
        <!-- ✅ FIXED: Wrap entire user section in ClientOnly -->
        <ClientOnly>
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
        </ClientOnly>
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
            <!-- ✅ FIXED: Wrap notification badge in ClientOnly -->
            <ClientOnly>
              <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
            </ClientOnly>
          </NuxtLink>

          <!-- Explore -->
          <NuxtLink to="/explore" class="sidebar-item" @click="toggleSidebar">
            <Icon name="compass" size="18" />
            <span>Explore</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- PP Feature -->
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
          <!-- ✅ FIXED: Wrap user profile card in ClientOnly -->
          <ClientOnly>
            <UserProfileCard />
          </ClientOnly>
        </aside>

        <!-- Center - Feed Posts -->
        <section class="center-feed">
          <!-- Create Post Card -->
          <!-- ✅ FIXED: Wrap create post section in ClientOnly -->
          <ClientOnly>
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
          </ClientOnly>

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

// ===== PAGE META =====
definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

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
const userAvatar = computed(() => authStore.user?.avatar_url || '/default-avatar.png')

// ===== FEED STATE =====
const showCreatePostModal = ref(false)
const isLoading = ref(false)
const newPostContent = ref('')

// ===== CURRENT USER DATA =====
const currentUserName = computed(() => authStore.userDisplayName || 'You')
const currentUserAvatar = computed(() => authStore.user?.avatar_url || '/default-avatar.png')

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
    createdAt: new Date(Date.now() - 200000),
    commentsList: []
  }
])

// ===== TRENDING TOPICS =====
const trendingTopics = reactive<TrendingTopic[]>([
  { id: '1', category: 'Technology', title: '#WebDevelopment', count: 45 },
  { id: '2', category: 'Entertainment', title: '#MovieNight', count: 32 },
  { id: '3', category: 'Sports', title: '#Football', count: 28 },
  { id: '4', category: 'News', title: '#Breaking', count: 19 }
])

// ===== SUGGESTED USERS =====
const suggestedUsers = reactive<SuggestedUser[]>([
  { id: '1', name: 'Sarah Wilson', username: 'sarahwilson', avatar: '/default-avatar.png' },
  { id: '2', name: 'Mike Brown', username: 'mikebrown', avatar: '/default-avatar.png' },
  { id: '3', name: 'Emma Davis', username: 'emmadavis', avatar: '/default-avatar.png' }
])

// ===== HEADER METHODS =====
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const goToProfile = () => {
  router.push('/profile')
}

const handleLogout = async () => {
  try {
    await authStore.clearAuth()
    router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// ===== FEED METHODS =====
const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Handle image upload
    console.log('Image uploaded:', file.name)
  }
}

const submitPost = async () => {
  if (!newPostContent.value.trim()) return
  
  try {
    // Submit post logic here
    console.log('Submitting post:', newPostContent.value)
    
    // Reset and close modal
    newPostContent.value = ''
    showCreatePostModal.value = false
  } catch (error) {
    console.error('Error submitting post:', error)
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  // Load feed data
  console.log('[Feed] Component mounted')
})
</script>

<style scoped>
/* Add your existing styles here - they remain unchanged */
/* I'm omitting the styles for brevity, but keep all your existing CSS */
</style>

