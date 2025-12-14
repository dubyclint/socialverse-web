<!-- FILE: /components/feed/FeedHeader.vue -->
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
          to="/chat" 
          class="nav-icon" 
          :class="{ active: route.path === '/chat' }"
          aria-label="Chat"
        >
          <Icon name="message-circle" size="24" />
          <span class="nav-label">Chat</span>
          <span v-if="unreadMessages > 0" class="notification-badge">
            {{ unreadMessages }}
          </span>
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
          to="/explore" 
          class="nav-icon" 
          :class="{ active: route.path === '/explore' }"
          aria-label="Explore"
        >
          <Icon name="compass" size="24" />
          <span class="nav-label">Explore</span>
        </NuxtLink>
      </nav>

      <!-- Right Side - User & Wallet -->
      <div class="header-right">
        <div class="wallet-info">
          <Icon name="wallet" size="20" />
          <span class="wallet-balance">${{ walletBalance.toFixed(2) }}</span>
        </div>
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
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const unreadMessages = ref(0)
const isLiveStreaming = ref(false)
const walletBalance = ref(150.50)
const userName = ref('John Doe')
const userAvatar = ref('/default-avatar.png')
const userStatus = ref('online')

const toggleSidebar = () => {
  // Emit event to parent or use store
  console.log('Toggle sidebar')
}

const goToProfile = () => {
  router.push('/profile')
}
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

.wallet-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1e293b;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.9rem;
  font-weight: 600;
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

@media (max-width: 768px) {
  .header-center {
    gap: 0.25rem;
  }

  .nav-label {
    display: none;
  }

  .wallet-info {
    display: none;
  }
}
</style>
