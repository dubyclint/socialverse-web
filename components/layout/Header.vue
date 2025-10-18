<template>
  <header class="modern-header">
    <!-- Top Navigation Bar -->
    <div class="header-top">
      <!-- Left Side - Menu & Logo -->
      <div class="header-left">
        <button @click="toggleSidebar" class="menu-btn">
          <Icon name="menu" size="20" />
        </button>
        <NuxtLink to="/" class="logo">
          <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
          <span class="logo-text">SocialVerse</span>
        </NuxtLink>
      </div>

      <!-- Center - Navigation Icons -->
      <div class="header-center">
        <NuxtLink to="/" class="nav-icon" :class="{ active: $route.path === '/' }">
          <Icon name="home" size="24" />
          <span class="nav-label">Home</span>
        </NuxtLink>
        <NuxtLink to="/chat" class="nav-icon" :class="{ active: $route.path === '/chat' }">
          <Icon name="message-circle" size="24" />
          <span class="nav-label">Chat</span>
          <span v-if="unreadMessages > 0" class="notification-badge">{{ unreadMessages }}</span>
        </NuxtLink>
        <NuxtLink to="/post" class="nav-icon" :class="{ active: $route.path === '/post' }">
          <Icon name="plus-square" size="24" />
          <span class="nav-label">Post</span>
        </NuxtLink>
      </div>

      <!-- Right Side - Profile & Wallet -->
      <div class="header-right">
        <!-- Wallet Icon with Dropdown -->
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

        <!-- Profile Picture with Status -->
        <div class="profile-container">
          <div class="profile-avatar" @click="toggleProfileMenu">
            <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
            <div class="status-dot" :class="user.status"></div>
          </div>
          
          <!-- Profile Dropdown -->
          <div v-if="showProfileMenu" class="profile-dropdown">
            <div class="profile-info">
              <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
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
          </div>
        </div>
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
          <NuxtLink to="/p2p" class="sidebar-item">
            <Icon name="users" size="20" />
            <span>P2P Trading</span>
          </NuxtLink>
          <NuxtLink to="/escrow" class="sidebar-item">
            <Icon name="shield" size="20" />
            <span>Escrow Services</span>
          </NuxtLink>
          <NuxtLink to="/support" class="sidebar-item">
            <Icon name="help-circle" size="20" />
            <span>Agent Support</span>
          </NuxtLink>
          <NuxtLink to="/ads" class="sidebar-item">
            <Icon name="target" size="20" />
            <span>Ad Center</span>
          </NuxtLink>
          <NuxtLink to="/monetization" class="sidebar-item">
            <Icon name="dollar-sign" size="20" />
            <span>Monetization</span>
          </NuxtLink>
          <NuxtLink to="/analytics" class="sidebar-item">
            <Icon name="bar-chart" size="20" />
            <span>Analytics</span>
          </NuxtLink>
          <NuxtLink to="/marketplace" class="sidebar-item">
            <Icon name="shopping-bag" size="20" />
            <span>Marketplace</span>
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Reactive data
const showSidebar = ref(false)
const showWalletMenu = ref(false)
const showProfileMenu = ref(false)
const unreadMessages = ref(3)
const walletBalance = ref(1250.50)

// User data (would come from your auth store)
const user = ref({
  name: 'John Doe',
  username: 'johndoe',
  avatar: '/default-avatar.png',
  status: 'online' // online, away, busy, offline
})

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
  },
  // Add more items...
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
  navigateTo('/p2p')
  showWalletMenu.value = false
}

const openPEW = () => {
  navigateTo('/pew')
  showWalletMenu.value = false
}

const openEscrow = () => {
  navigateTo('/escrow')
  showWalletMenu.value = false
}

const openMediaItem = (item) => {
  // Handle media item click
  navigateTo(`/media/${item.id}`)
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
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

.logo-img {
  width: 32px;
  height: 32px;
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
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-icon:hover,
.nav-icon.active {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: 5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.wallet-container {
  position: relative;
}

.wallet-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.wallet-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.wallet-balance {
  font-weight: 600;
  font-size: 0.9rem;
}

.wallet-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  min-width: 200px;
  margin-top: 0.5rem;
}

.wallet-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333;
}

.wallet-option:hover {
  background: #f8f9fa;
}

.profile-container {
  position: relative;
}

.profile-avatar {
  position: relative;
  cursor: pointer;
}

.profile-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.profile-avatar:hover img {
  border-color: white;
  transform: scale(1.05);
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-dot.online { background: #2ed573; }
.status-dot.away { background: #ffa502; }
.status-dot.busy { background: #ff4757; }
.status-dot.offline { background: #747d8c; }

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 1rem;
  min-width: 250px;
  margin-top: 0.5rem;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.profile-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.profile-info h4 {
  margin: 0;
  color: #333;
}

.profile-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

/* Media Container */
.media-container {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.media-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 0 2rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.media-scroll::-webkit-scrollbar {
  display: none;
}

.media-item {
  flex-shrink: 0;
  width: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.media-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.media-thumbnail {
  position: relative;
  width: 100%;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.media-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 0.5rem;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.media-info h5 {
  color: white;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.media-info p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
}

.media-type {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

/* Sidebar */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100%;
  background: white;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
}

.sidebar-nav {
  padding: 1rem;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.sidebar-item:hover {
  background: #f8f9fa;
  transform: translateX(4px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-top {
    padding: 1rem;
  }
  
  .header-center {
    gap: 1rem;
  }
  
  .nav-label {
    display: none;
  }
  
  .wallet-balance {
    display: none;
  }
  
  .media-scroll {
    padding: 0 1rem;
  }
  
  .media-item {
    width: 150px;
  }
  
  .sidebar {
    width: 280px;
  }
}

@media (max-width: 480px) {
  .header-center {
    gap: 0.5rem;
  }
  
  .nav-icon {
    padding: 0.5rem;
  }
  
  .media-item {
    width: 120px;
  }
}
</style>
