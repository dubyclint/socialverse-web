<!-- FILE: /components/layout/header.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     HEADER COMPONENT - FIXED: All user-specific data wrapped in ClientOnly
     ✅ FIXED: Wallet balance wrapped
     ✅ FIXED: User profile data wrapped
     ✅ FIXED: Notification badges wrapped
     ============================================================================ -->

<template>
  <header class="modern-header">
    <!-- Top Navigation Bar ---->
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
          <!-- ✅ FIXED: Wrap notification badge in ClientOnly -->
          <ClientOnly>
            <span v-if="unreadMessages > 0" class="notification-badge">{{ unreadMessages }}</span>
          </ClientOnly>
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
          <!-- ✅ FIXED: Wrap live badge in ClientOnly -->
          <ClientOnly>
            <span v-if="isLiveStreaming" class="live-badge">LIVE</span>
          </ClientOnly>
        </NuxtLink>

        <!-- Universe Link -->
        <NuxtLink to="/universe" class="nav-icon" :class="{ active: $route.path === '/universe' }">
          <Icon name="globe" size="24" />
          <span class="nav-label">Universe</span>
        </NuxtLink>
      </div>

      <!-- Right Side - Profile & Wallet -->
      <div class="header-right">
        <!-- ✅ FIXED: Wrap entire wallet section in ClientOnly -->
        <ClientOnly>
          <div class="wallet-container" @click="toggleWalletMenu">
            <div class="wallet-icon">
              <Icon name="wallet" size="24" />
              <span class="wallet-balance">${{ walletBalance }}</span>
            </div>
            
            <!-- Wallet Dropdown -->
            <div v-if="showWalletMenu" class="wallet-dropdown">
              <div class="wallet-option" @click="openP2P">
                <Icon name="users" size="18" />
                <span>P2P Trading</span>
              </div>
              <div class="wallet-option" @click="openPEW">
                <Icon name="zap" size="18" />
                <span>PEW Tokens</span>
              </div>
              <div class="wallet-option" @click="openEscrow">
                <Icon name="shield" size="18" />
                <span>Escrow</span>
              </div>
            </div>
          </div>
        </ClientOnly>

        <!-- ✅ FIXED: Wrap entire profile section in ClientOnly -->
        <ClientOnly>
          <div class="profile-container">
            <div class="profile-avatar" @click="toggleProfileMenu">
              <img :src="user.avatar" :alt="user.name" />
              <div class="status-dot" :class="user.status"></div>
            </div>
            
            <!-- Profile Dropdown -->
            <div v-if="showProfileMenu" class="profile-dropdown">
              <div class="profile-info">
                <img :src="user.avatar" :alt="user.name" />
                <div>
                  <h4>{{ user.name }}</h4>
                  <p>@{{ user.username }}</p>
                </div>
              </div>
              <hr />
              <NuxtLink to="/profile" class="dropdown-item">
                <Icon name="user" size="18" />
                <span>My Profile</span>
              </NuxtLink>
              <NuxtLink to="/settings" class="dropdown-item">
                <Icon name="settings" size="18" />
                <span>Settings</span>
              </NuxtLink>
              <button @click="handleLogout" class="dropdown-item logout-btn">
                <Icon name="log-out" size="18" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </ClientOnly>
      </div>
    </div>

    <!-- Media Container - Horizontal Scrolling -->
    <div class="media-container">
      <div class="media-scroll">
        <div 
          v-for="item in mediaItems" 
          :key="item.id" 
          class="media-item"
          @click="openMediaItem(item)"
        >
          <div class="media-thumbnail">
            <img :src="item.thumbnail" :alt="item.title" />
            <div class="media-overlay">
              <Icon :name="item.type === 'video' ? 'play' : 'image'" size="20" />
            </div>
          </div>
          <div class="media-info">
            <h5>{{ item.title }}</h5>
            <p>{{ item.author }}</p>
            <span class="media-type">{{ item.category }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar Menu -->
    <div v-if="showSidebar" class="sidebar-overlay" @click="closeSidebar">
      <div class="sidebar" @click.stop>
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button @click="closeSidebar" class="close-btn">
            <Icon name="x" size="20" />
          </button>
        </div>
        
        <nav class="sidebar-nav">
          <!-- Main Navigation -->
          <NuxtLink to="/feed" class="sidebar-item">
            <Icon name="home" size="20" />
            <span>Feed</span>
          </NuxtLink>
          <NuxtLink to="/chat" class="sidebar-item">
            <Icon name="message-circle" size="20" />
            <span>Chat</span>
          </NuxtLink>
          <NuxtLink to="/posts" class="sidebar-item">
            <Icon name="plus-square" size="20" />
            <span>Create Post</span>
          </NuxtLink>
          <NuxtLink to="/streaming" class="sidebar-item">
            <Icon name="radio" size="20" />
            <span>Live Stream</span>
          </NuxtLink>
          <NuxtLink to="/universe" class="sidebar-item">
            <Icon name="globe" size="20" />
            <span>Universe</span>
          </NuxtLink>

          <hr class="sidebar-divider" />

          <!-- Trading & Services -->
          <NuxtLink to="/p2p" class="sidebar-item">
            <Icon name="users" size="20" />
            <span>P2P Trading</span>
          </NuxtLink>
          <NuxtLink to="/trade" class="sidebar-item">
            <Icon name="trending-up" size="20" />
            <span>Trade</span>
          </NuxtLink>
          <NuxtLink to="/escrow" class="sidebar-item">
            <Icon name="shield" size="20" />
            <span>Escrow Services</span>
          </NuxtLink>

          <hr class="sidebar-divider" />

          <!-- Community & Matching -->
          <NuxtLink to="/cross-meet" class="sidebar-item">
            <Icon name="heart" size="20" />
            <span>Cross Meet</span>
          </NuxtLink>
          <NuxtLink to="/explore" class="sidebar-item">
            <Icon name="compass" size="20" />
            <span>Explore</span>
          </NuxtLink>

          <hr class="sidebar-divider" />

          <!-- Support & Tools -->
          <NuxtLink to="/support" class="sidebar-item">
            <Icon name="help-circle" size="20" />
            <span>Support</span>
          </NuxtLink>
          <NuxtLink to="/notifications" class="sidebar-item">
            <Icon name="bell" size="20" />
            <span>Notifications</span>
          </NuxtLink>
          <NuxtLink to="/inbox" class="sidebar-item">
            <Icon name="inbox" size="20" />
            <span>Inbox</span>
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Reactive data
const showSidebar = ref(false)
const showWalletMenu = ref(false)
const showProfileMenu = ref(false)
const unreadMessages = ref(3)
const walletBalance = ref(1.50)
const isLiveStreaming = ref(false)

// Computed properties from auth store - DYNAMIC USER DATA
const user = computed(() => ({
  name: authStore.userDisplayName,
  username: authStore.user?.username || 'user',
  avatar: authStore.user?.avatar_url || '/default-avatar.png',
  status: 'online' // online, away, busy, offline
}))

// Media items for horizontal scroll
const mediaItems = ref([
  {
    id: 1,
    title: 'Latest Tech News',
    author: 'TechDaily',
    thumbnail: '/media/tech-news.jpg',
    type: 'article',
    category: 'Trending'
  },
  {
    id: 2,
    title: 'Crypto Market Update',
    author: 'CryptoInsider',
    thumbnail: '/media/crypto.jpg',
    type: 'video',
    category: 'Sponsored'
  },
  {
    id: 3,
    title: 'Friend\'s Wedding',
    author: 'Sarah Johnson',
    thumbnail: '/media/wedding.jpg',
    type: 'image',
    category: 'Friends'
  }
])

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const closeSidebar = () => {
  showSidebar.value = false
}

const toggleWalletMenu = () => {
  showWalletMenu.value = !showWalletMenu.value
  showProfileMenu.value = false
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
  showWalletMenu.value = false
}

const openP2P = () => {
  router.push('/p2p')
  showWalletMenu.value = false
}

const openPEW = () => {
  router.push('/my-pocket')
  showWalletMenu.value = false
}

const openEscrow = () => {
  router.push('/escrow')
  showWalletMenu.value = false
}

const openMediaItem = (item) => {
  // Handle media item click
  router.push(`/media/${item.id}`)
}

const handleLogout = async () => {
  try {
    // Call your logout function from auth store
    await authStore.clearAuth()
    router.push('/auth/login')
  } catch (err) {
    console.error('Logout error:', err)
  }
}

// Close dropdowns when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.wallet-container')) {
      showWalletMenu.value = false
    }
    if (!e.target.closest('.profile-container')) {
      showProfileMenu.value = false
    }
  })
})
</script>

<style scoped>
.modern-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
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
  transition: alls;
  position: relative;
}

.nav-icon:hover {
  color: white;
}

.nav-icon.active {
  color: white;
  border-bottom: 3px solid white;
  padding-bottom: 0.5rem;
}

.nav-label {
  font-size:rem;
  font-weight: 500;
}

.notification-badge {
  position: absolute;
  top: -px;
  right: -8px;
  background: #ff;
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

.live-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: bold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.wallet-container {
  position: relative;
  cursor: pointer;
}

.wallet-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  transition: all 0.3s;
}

.wallet-icon:hover {
  transform: scale(1.05);
}

.wallet-balance {
  font-weight: ;
  font-size: 0.9rem;
}

.wallet-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  margin-top: 0.5rem;
  z-index: ;
}

.wallet-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.wallet-option:hover {
  background: #f5f5f5;
}

.profile-container {
  position: relative;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.profile-avatar:hover {
  border-color: white;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-dot.online {
  background: #ecc71;
}

.status-dot.away {
  background: #f39c12;
}

.status-dot.busy {
  background: #e74c3c;
}

.status-dot.offline {
  background: #a5a6;
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  margin-top: 0.5rem;
  z-index: 1001;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.profile-info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info h4 {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
}

.profile-info p {
  margin: 0;
  color: #666;
  font-size: rem;
}

.profile-dropdown hr {
  margin: 0;
  border: none;
  border-top: 1px solid #eee;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: rem;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.logout-btn {
  color: #e74c3c;
}

.media-container {
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem 2rem;
  overflow-x: auto;
}

.media-scroll {
  display: flex;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.media-item {
  flex-shrink: 0;
  width: 150px;
  cursor: pointer;
  transition: all 0.3s;
}

.media-item:hover {
  transform: translateY(-4px);
}

.media-thumbnail {
  position: relative;
  width: 100%;
  height:px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.media-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.media-info {
  padding: 0.5rem ;
}

.media-info h5 {
  margin: 0.rem 0;
  color: white;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-info p {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
}

.media-type {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.rem 0.4rem;
  border-radius:px;
  font-size:rem;
  margin-top: 0.25rem;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 1000;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
  font-size:rem;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.sidebar-nav {
  padding: 1rem 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  color: #333;
  text-decoration: none;
  transition: all 0.3s;
}

.sidebar-item:hover {
  background: #f5f5f5;
  padding-left: 2rem;
}

.sidebar-item.router-link-active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-left: 3px solid #667eea;
  padding-left: calc(1.5rem - 3px);
}

.sidebar-divider {
  margin: 1rem 0;
  border: none;
  border-top: 1px solid #eee;
}

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

  .header-right {
    gap: 1rem;
  }

  .media-container {
    padding: .75rem 1rem;
  }
}
</style>

