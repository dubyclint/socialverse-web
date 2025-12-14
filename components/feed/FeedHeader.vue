<!-- FILE: /components/feed/FeedHeader.vue (FIXED - Proper watch import) -->
<template>
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

      <!-- Center - Navigation Icons (UPDATED: Removed Explore, Added Wallet) -->
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

    <!-- Sidebar Menu (UPDATED: New items, no duplicates) -->
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const sidebarOpen = ref(false)
const unreadMessages = ref(0)
const isLiveStreaming = ref(false)
const userStatus = ref('online')

// Get user data from store
const userName = computed(() => authStore.userDisplayName || 'User')
const userAvatar = computed(() => authStore.userAvatar || '/default-avatar.png')

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

// Close sidebar on route change
onMounted(() => {
  watch(() => route.path, () => {
    sidebarOpen.value = false
  })
})
</script>

<style scoped>
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

/* Sidebar Styles */
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

.sidebar-item .badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
}

.sidebar-divider {
  height: 1px;
  background: #334155;
  margin: 0.5rem 0;
}

.logout-btn {
  color: #ef4444;
}

.logout-btn:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

@media (max-width: 768px) {
  .header-center {
    gap: 0.25rem;
  }

  .nav-label {
    display: none;
  }

  .sidebar {
    width: 100%;
    max-width: 280px;
  }
}
</style>
