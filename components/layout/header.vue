<!-- /components/layout/header.vue -->
<template>
  <header class="modern-header">
    <div class="header-top">
      <div class="header-left">
        <button class="menu-btn" @click="toggleSidebar">
          <Icon name="menu" size="24" />
        </button>
        <NuxtLink to="/" class="logo">
          <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
          <span class="logo-text">SocialVerse</span>
        </NuxtLink>
      </div>

      <div class="header-center">
        <NuxtLink to="/feed" class="nav-icon">
          <Icon name="home" size="20" />
          <span class="nav-label">Feed</span>
        </NuxtLink>
        <NuxtLink to="/explore" class="nav-icon">
          <Icon name="compass" size="20" />
          <span class="nav-label">Explore</span>
        </NuxtLink>
        <NuxtLink to="/match" class="nav-icon">
          <Icon name="heart" size="20" />
          <span class="nav-label">Match</span>
        </NuxtLink>
      </div>

      <div class="header-right">
        <ClientOnly>
          <div class="wallet-container" @click="toggleWalletMenu">
            <div class="wallet-icon">
              <Icon name="wallet" size="20" />
              <span class="wallet-balance">${{ walletBalance.toFixed(2) }}</span>
            </div>
            <div v-if="showWalletMenu" class="wallet-dropdown">
              <button class="wallet-option" @click="openP2P">
                <Icon name="send" size="16" />
                <span>P2P Trading</span>
              </button>
              <button class="wallet-option" @click="openPEW">
                <Icon name="gift" size="16" />
                <span>PEW Gifts</span>
              </button>
              <button class="wallet-option" @click="openEscrow">
                <Icon name="lock" size="16" />
                <span>Escrow</span>
              </button>
            </div>
          </div>

          <div class="profile-container" @click="toggleProfileMenu">
            <div class="profile-avatar">
              <img :src="user.avatar" :alt="user.name" />
              <div :class="['status-dot', user.status]"></div>
            </div>
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
                <Icon name="user" size="16" />
                <span>Profile</span>
              </NuxtLink>
              <NuxtLink to="/settings" class="dropdown-item">
                <Icon name="settings" size="16" />
                <span>Settings</span>
              </NuxtLink>
              <button class="dropdown-item logout-btn" @click="handleLogout">
                <Icon name="logout" size="16" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </ClientOnly>
      </div>
    </div>

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
              <Icon name="play" size="32" />
            </div>
          </div>
          <div class="media-info">
            <h5>{{ item.title }}</h5>
            <p>{{ item.author }}</p>
            <span class="media-type">{{ item.type }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSidebar" class="sidebar-overlay" @click="closeSidebar"></div>
    <div v-if="showSidebar" class="sidebar">
      <div class="sidebar-header">
        <h3>Menu</h3>
        <button @click="closeSidebar" class="close-btn">
          <Icon name="close" size="24" />
        </button>
      </div>
      <nav class="sidebar-nav">
        <NuxtLink to="/feed" class="sidebar-item">
          <Icon name="home" size="20" />
          <span>Feed</span>
        </NuxtLink>
        <NuxtLink to="/explore" class="sidebar-item">
          <Icon name="compass" size="20" />
          <span>Explore</span>
        </NuxtLink>
        <NuxtLink to="/match" class="sidebar-item">
          <Icon name="heart" size="20" />
          <span>Match</span>
        </NuxtLink>
        <NuxtLink to="/profile" class="sidebar-item">
          <Icon name="user" size="20" />
          <span>Profile</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="sidebar-item">
          <Icon name="settings" size="20" />
          <span>Settings</span>
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
  </header>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'

const router = useRouter()
const authStore = useAuthStore()
const { logout } = useAuth()

const showSidebar = ref(false)
const showWalletMenu = ref(false)
const showProfileMenu = ref(false)
const unreadMessages = ref(3)
const walletBalance = ref(1.50)
const isLiveStreaming = ref(false)

const user = computed(() => ({
  name: authStore.userDisplayName,
  username: authStore.user?.username || 'user',
  avatar: authStore.user?.avatar_url || '/default-avatar.png',
  status: 'online'
}))

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
  router.push(`/media/${item.id}`)
}

const handleLogout = async () => {
  try {
    console.log('[Header] Initiating logout...')
    
    const result = await logout()
    
    if (result.success) {
      console.log('[Header] Logout successful, redirecting to login')
      
      showProfileMenu.value = false
      showWalletMenu.value = false
      showSidebar.value = false
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await router.push('/auth/login')
      
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 500)
    } else {
      console.error('[Header] Logout failed:', result.error)
      await router.push('/auth/login')
    }
  } catch (err) {
    console.error('[Header] Logout error:', err)
    router.push('/auth/login')
  }
}

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
  transition: all 0.3s;
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
  font-size: 0.75rem;
  font-weight: 500;
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
  font-weight: bold;
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
  z-index: 1001;
}

.wallet-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #333;
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
  background: #2ecc71;
}

.status-dot.away {
  background: #f39c12;
}

.status-dot.busy {
  background: #e74c3c;
}

.status-dot.offline {
  background: #95a5a6;
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
  font-size: 0.85rem;
}

.profile-dropdown hr {
  margin: 0;
  border: none;
  border-top: 1px solid #eee;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  height: 100px;
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
  padding: 0.5rem 0;
}

.media-info h5 {
  margin: 0.25rem 0;
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
  padding: 0.2rem 0.4rem;
  border-radius: 2px;
  font-size: 0.65rem;
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
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
  padding: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #333;
  text-decoration: none;
  transition: all 0.3s;
}

.sidebar-item:hover {
  background: #f5f5f5;
  color: #667eea;
}
</style>
