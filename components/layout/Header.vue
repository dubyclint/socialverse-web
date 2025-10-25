<template>
  <header class="modern-header">
    <!-- Top Navigation Bar -->
    <div class="header-top">
      <!-- Left Side - Menu & Logo -->
      <div class="header-left">
        <button @click="toggleSidebar" class="menu-btn" title="Open Menu">
          <Icon name="menu" size="20" />
        </button>
        <NuxtLink to="/feed" class="logo">
          <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
          <span class="logo-text">SocialVerse</span>
        </NuxtLink>
      </div>

      <!-- Center - Universe Icon -->
      <div class="header-center">
        <NuxtLink to="/universe" class="nav-icon universe-icon" :class="{ active: isActive('/universe') }" title="Universe">
          <Icon name="globe" size="28" />
          <span class="nav-label">Universe</span>
        </NuxtLink>
      </div>

      <!-- Right Side - Wallet & Profile -->
      <div class="header-right">
        <!-- Wallet Icon with Dropdown -->
        <div class="wallet-container">
          <button @click.stop="toggleWalletMenu" class="wallet-icon" title="Wallet">
            <Icon name="wallet" size="24" />
            <span class="wallet-balance">${{ walletBalance }}</span>
          </button>
          
          <!-- Wallet Dropdown Menu - Box Style -->
          <div v-if="showWalletMenu" class="wallet-dropdown" @click.stop>
            <div class="wallet-box">
              <div class="wallet-header">
                <h4>Wallet</h4>
                <button @click="closeWalletMenu" class="close-icon">
                  <Icon name="x" size="16" />
                </button>
              </div>
              
              <div class="wallet-balance-display">
                <span class="balance-label">Total Balance</span>
                <span class="balance-amount">${{ walletBalance }}</span>
              </div>

              <div class="wallet-options">
                <NuxtLink to="/my-pocket" class="wallet-option-box" @click="closeWalletMenu">
                  <div class="option-icon">
                    <Icon name="zap" size="24" />
                  </div>
                  <div class="option-content">
                    <h5>PEW Tokens</h5>
                    <p>Manage your tokens</p>
                  </div>
                  <Icon name="chevron-right" size="18" />
                </NuxtLink>

                <NuxtLink to="/p2p" class="wallet-option-box" @click="closeWalletMenu">
                  <div class="option-icon">
                    <Icon name="users" size="24" />
                  </div>
                  <div class="option-content">
                    <h5>P2P Trading</h5>
                    <p>Buy & sell with others</p>
                  </div>
                  <Icon name="chevron-right" size="18" />
                </NuxtLink>

                <NuxtLink to="/p2p" class="wallet-option-box" @click="closeWalletMenu">
                  <div class="option-icon">
                    <Icon name="shield" size="24" />
                  </div>
                  <div class="option-content">
                    <h5>Create Deal</h5>
                    <p>Start a new escrow deal</p>
                  </div>
                  <Icon name="chevron-right" size="18" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Picture with Status -->
        <div class="profile-container">
          <NuxtLink to="/profile" @click.stop="toggleProfileMenu" class="profile-avatar" title="Profile">
            <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
            <div class="status-dot" :class="user.status"></div>
          </NuxtLink>
          
          <!-- Profile Dropdown Menu - Box Style -->
          <div v-if="showProfileMenu" class="profile-dropdown" @click.stop>
            <div class="profile-box">
              <div class="profile-header">
                <h4>Profile</h4>
                <button @click="closeProfileMenu" class="close-icon">
                  <Icon name="x" size="16" />
                </button>
              </div>

              <div class="profile-info-box">
                <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                <div>
                  <h5>{{ user.name }}</h5>
                  <p>@{{ user.username }}</p>
                </div>
              </div>

              <div class="profile-options">
                <NuxtLink to="/profile" class="profile-option-box" @click="closeProfileMenu">
                  <Icon name="user" size="20" />
                  <span>My Profile</span>
                  <Icon name="chevron-right" size="18" />
                </NuxtLink>

                <NuxtLink to="/Settings" class="profile-option-box" @click="closeProfileMenu">
                  <Icon name="settings" size="20" />
                  <span>Settings</span>
                  <Icon name="chevron-right" size="18" />
                </NuxtLink>

                <button @click="handleLogout" class="profile-option-box logout-option">
                  <Icon name="log-out" size="20" />
                  <span>Logout</span>
                  <Icon name="chevron-right" size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- More Menu Button -->
        <div class="more-container">
          <button @click.stop="toggleMoreMenu" class="more-btn" title="More">
            <Icon name="menu" size="24" />
          </button>

          <!-- More Menu Dropdown - Box Style -->
          <div v-if="showMoreMenu" class="more-dropdown" @click.stop>
            <div class="more-box">
              <div class="more-header">
                <h4>More</h4>
                <button @click="closeMoreMenu" class="close-icon">
                  <Icon name="x" size="16" />
                </button>
              </div>

              <div class="more-options">
                <!-- Main Navigation -->
                <div class="more-section">
                  <h6 class="section-title">Navigation</h6>
                  <NuxtLink to="/feed" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="home" size="20" />
                    <span>Feed</span>
                    <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
                  </NuxtLink>
                  <NuxtLink to="/chat" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="message-circle" size="20" />
                    <span>Chat</span>
                    <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
                  </NuxtLink>
                  <NuxtLink to="/posts" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="plus-square" size="20" />
                    <span>Create Post</span>
                  </NuxtLink>
                  <NuxtLink to="/groups" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="radio" size="20" />
                    <span>Live Stream</span>
                    <span v-if="isLiveStreaming" class="live-badge">LIVE</span>
                  </NuxtLink>
                </div>

                <hr class="more-divider" />

                <!-- Community -->
                <div class="more-section">
                  <h6 class="section-title">Community</h6>
                  <NuxtLink to="/cross-meet" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="heart" size="20" />
                    <span>Universe Match</span>
                  </NuxtLink>
                  <NuxtLink to="/explore" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="compass" size="20" />
                    <span>Explore</span>
                  </NuxtLink>
                </div>

                <hr class="more-divider" />

                <!-- Support -->
                <div class="more-section">
                  <h6 class="section-title">Support</h6>
                  <NuxtLink to="/support" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="help-circle" size="20" />
                    <span>Support</span>
                  </NuxtLink>
                  <NuxtLink to="/notifications" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="bell" size="20" />
                    <span>Notifications</span>
                  </NuxtLink>
                  <NuxtLink to="/inbox" class="more-option-box" @click="closeMoreMenu">
                    <Icon name="inbox" size="20" />
                    <span>Inbox</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar Menu for Mobile -->
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
          <NuxtLink to="/feed" class="sidebar-item" @click="closeSidebar">
            <Icon name="home" size="20" />
            <span>Feed</span>
          </NuxtLink>
          <NuxtLink to="/chat" class="sidebar-item" @click="closeSidebar">
            <Icon name="message-circle" size="20" />
            <span>Chat</span>
          </NuxtLink>
          <NuxtLink to="/posts" class="sidebar-item" @click="closeSidebar">
            <Icon name="plus-square" size="20" />
            <span>Create Post</span>
          </NuxtLink>
          <NuxtLink to="/groups" class="sidebar-item" @click="closeSidebar">
            <Icon name="radio" size="20" />
            <span>Live Stream</span>
          </NuxtLink>
          <NuxtLink to="/universe" class="sidebar-item" @click="closeSidebar">
            <Icon name="globe" size="20" />
            <span>Universe</span>
          </NuxtLink>

          <hr class="sidebar-divider" />

          <!-- Trading & Services -->
          <NuxtLink to="/p2p" class="sidebar-item" @click="closeSidebar">
            <Icon name="users" size="20" />
            <span>P2P Trading</span>
          </NuxtLink>
          <NuxtLink to="/trade" class="sidebar-item" @click="closeSidebar">
            <Icon name="trending-up" size="20" />
            <span>Trade</span>
          </NuxtLink>
          <NuxtLink to="/my-pocket" class="sidebar-item" @click="closeSidebar">
            <Icon name="wallet" size="20" />
            <span>My Wallet</span>
          </NuxtLink>

          <hr class="sidebar-divider" />

          <!-- Community & Matching -->
          <NuxtLink to="/cross-meet" class="sidebar-item" @click="closeSidebar">
            <Icon name="heart" size="20" />
            <span>Universe Match</span>
          </NuxtLink>
          <NuxtLink to="/explore" class="sidebar-item" @click="closeSidebar">
            <Icon name="compass" size="20" />
            <span>Explore</span>
          </NuxtLink>

          <hr class="sidebar-divider" />

          <!-- Support & Tools -->
          <NuxtLink to="/support" class="sidebar-item" @click="closeSidebar">
            <Icon name="help-circle" size="20" />
            <span>Support</span>
          </NuxtLink>
          <NuxtLink to="/notifications" class="sidebar-item" @click="closeSidebar">
            <Icon name="bell" size="20" />
            <span>Notifications</span>
          </NuxtLink>
          <NuxtLink to="/inbox" class="sidebar-item" @click="closeSidebar">
            <Icon name="inbox" size="20" />
            <span>Inbox</span>
          </NuxtLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Reactive state
const showSidebar = ref(false)
const showWalletMenu = ref(false)
const showProfileMenu = ref(false)
const showMoreMenu = ref(false)
const unreadMessages = ref(3)
const walletBalance = ref(1250.50)
const isLiveStreaming = ref(false)

// User data (connect to your auth store)
const user = ref({
  name: 'John Doe',
  username: 'johndoe',
  avatar: '/default-avatar.png',
  status: 'online' // online, away, busy, offline
})

// Helper function to check active route
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Toggle functions
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
  if (showSidebar.value) {
    showWalletMenu.value = false
    showProfileMenu.value = false
    showMoreMenu.value = false
  }
}

const closeSidebar = () => {
  showSidebar.value = false
}

const toggleWalletMenu = () => {
  showWalletMenu.value = !showWalletMenu.value
  showProfileMenu.value = false
  showMoreMenu.value = false
}

const closeWalletMenu = () => {
  showWalletMenu.value = false
}

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
  showWalletMenu.value = false
  showMoreMenu.value = false
}

const closeProfileMenu = () => {
  showProfileMenu.value = false
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
  showWalletMenu.value = false
  showProfileMenu.value = false
}

const closeMoreMenu = () => {
  showMoreMenu.value = false
}

const closeAllMenus = () => {
  showWalletMenu.value = false
  showProfileMenu.value = false
  showMoreMenu.value = false
  showSidebar.value = false
}

// Navigation functions
const handleLogout = async () => {
  try {
    // TODO: Connect to your auth store logout function
    // await authStore.logout()
    closeAllMenus()
    await router.push('/auth/login')
  } catch (err) {
    console.error('Logout error:', err)
  }
}

// Close menus when clicking outside
const handleClickOutside = (e) => {
  const walletContainer = document.querySelector('.wallet-container')
  const profileContainer = document.querySelector('.profile-container')
  const moreContainer = document.querySelector('.more-container')
  const sidebar = document.querySelector('.sidebar')
  
  if (walletContainer && !walletContainer.contains(e.target)) {
    showWalletMenu.value = false
  }
  if (profileContainer && !profileContainer.contains(e.target)) {
    showProfileMenu.value = false
  }
  if (moreContainer && !moreContainer.contains(e.target)) {
    showMoreMenu.value = false
  }
  if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.menu-btn')) {
    showSidebar.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

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
  padding: 1rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.menu-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.9;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.universe-icon {
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
  cursor: pointer;
}

.universe-icon:hover,
.universe-icon.active {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* ===== WALLET STYLES ===== */
.wallet-container {
  position: relative;
}

.wallet-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
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
  top: calc(100% + 0.75rem);
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideDown 0.2s ease;
  min-width: 320px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wallet-box {
  padding: 1.5rem;
}

.wallet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.wallet-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.close-icon {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #333;
}

.wallet-balance-display {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: white;
}

.balance-label {
  display: block;
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.balance-amount {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
}

.wallet-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wallet-option-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
  border: 1px solid #e1e5e9;
}

.wallet-option-box:hover {
  background: #f0f2f5;
  border-color: #667eea;
  transform: translateX(4px);
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 10px;
  color: #667eea;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-content h5 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.option-content p {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: #999;
}

/* ===== PROFILE STYLES ===== */
.profile-container {
  position: relative;
}

.profile-avatar {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border: none;
  background: none;
  padding: 0;
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
  bottom: 0;
  right: 0;
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
  top: calc(100% + 0.75rem);
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideDown 0.2s ease;
  min-width: 300px;
}

.profile-box {
  padding: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.profile-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.profile-info-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.profile-info-box img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.profile-info-box h5 {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
}

.profile-info-box p {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.85rem;
}

.profile-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-option-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;
}

.profile-option-box:hover {
  background: #f8f9fa;
  color: #667eea;
}

.profile-option-box svg {
  flex-shrink: 0;
}

.profile-option-box span:last-child {
  margin-left: auto;
  opacity: 0.5;
}

.logout-option {
  color: #ff4757;
  margin-top: 0.5rem;
  border-top: 1px solid #e1e5e9;
  padding-top: 1rem;
}

.logout-option:hover {
  background: #ffe5e5;
}

/* ===== MORE MENU STYLES ===== */
.more-container {
  position: relative;
}

.more-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.more-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideDown 0.2s ease;
  min-width: 280px;
  max-height: 80vh;
  overflow-y: auto;
}

.more-box {
  padding: 1.5rem;
}

.more-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.more-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.more-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.more-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-title {
  margin: 0.5rem 0 0.75rem 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.more-divider {
  border: none;
  border-top: 1px solid #e1e5e9;
  margin: 1rem 0;
}

.more-option-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: none;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;
  position: relative;
}

.more-option-box:hover {
  background: #f8f9fa;
  color: #667eea;
}

.more-option-box svg {
  flex-shrink: 0;
}

.more-option-box span:last-child {
  margin-left: auto;
  opacity: 0.5;
  font-size: 0.8rem;
}

.badge {
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
  margin-left: auto;
}

.live-badge {
  background: #ff4757;
  color: white;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-size: 0.6rem;
  font-weight: 700;
  margin-left: auto;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ===== SIDEBAR STYLES ===== */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
  overflow-y: auto;
  z-index: 2001;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e1e5e9;
  position: sticky;
  top: 0;
  background: white;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f8f9fa;
}

.sidebar-nav {
  padding: 1rem;
}

.sidebar-divider {
  border: none;
  border-top: 1px solid #e1e5e9;
  margin: 1rem 0;
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
  color: #667eea;
}

/* ===== MOBILE RESPONSIVE ===== */
@media (max-width: 1024px) {
  .header-top {
    padding: 1rem;
  }

  .wallet-balance {
    display: none;
  }

  .wallet-dropdown {
    min-width: 280px;
  }

  .profile-dropdown {
    min-width: 260px;
  }

  .more-dropdown {
    min-width: 260px;
  }
}

@media (max-width: 768px) {
  .header-top {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .logo-text {
    display: none;
  }

  .header-center {
    display: none;
  }

  .wallet-icon {
    padding: 0.5rem 0.75rem;
  }

  .wallet-balance {
    display: none;
  }

  .wallet-dropdown {
    min-width: 260px;
    right: -50px;
  }

  .profile-dropdown {
    min-width: 240px;
    right: -30px;
  }

  .more-dropdown {
    min-width: 240px;
    right: -30px;
  }

  .sidebar {
    width: 280px;
  }

  .more-btn {
    padding: 0.4rem;
  }
}

@media (max-width: 480px) {
  .header-top {
    padding: 0.5rem;
    gap: 0.25rem;
  }

  .logo {
    font-size: 1.2rem;
  }

  .logo-img {
    width: 28px;
    height: 28px;
  }

  .wallet-icon {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .wallet-dropdown {
    min-width: 240px;
    right: -80px;
  }

  .profile-avatar img {
    width: 36px;
    height: 36px;
  }

  .profile-dropdown {
    min-width: 220px;
    right: -60px;
  }

  .more-dropdown {
    min-width: 220px;
    right: -60px;
  }

  .sidebar {
    width: 260px;
  }

  .wallet-box,
  .profile-box,
  .more-box {
    padding: 1rem;
  }

  .wallet-balance-display {
    padding: 0.75rem;
  }

  .balance-amount {
    font-size: 1.5rem;
  }

  .wallet-option-box,
  .profile-info-box {
    padding: 0.75rem;
  }

  .option-icon {
    width: 40px;
    height: 40px;
  }

  .profile-info-box img {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 360px) {
  .header-top {
    padding: 0.4rem;
  }

  .logo {
    font-size: 1rem;
  }

  .logo-img {
    width: 24px;
    height: 24px;
  }

  .wallet-dropdown,
  .profile-dropdown,
  .more-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
    min-width: unset;
    max-height: 70vh;
  }

  .wallet-box,
  .profile-box,
  .more-box {
    padding: 1rem;
  }
}
</style>
