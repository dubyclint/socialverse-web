<!-- FILE: /layouts/default.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     DEFAULT LAYOUT - FIXED: All user-specific UI wrapped in ClientOnly
     ✅ FIXED: Notification badges wrapped
     ✅ FIXED: User-specific navigation wrapped
     ============================================================================ -->

<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-content">
        <slot name="sidebar">
          <!-- Default sidebar content -->
          <nav class="sidebar-nav">
            <NuxtLink to="/feed" class="nav-item" :class="{ active: isActive('/feed') }">
              <Icon name="home" size="20" />
              <span>Feed</span>
            </NuxtLink>
            <NuxtLink to="/explore" class="nav-item" :class="{ active: isActive('/explore') }">
              <Icon name="compass" size="20" />
              <span>Explore</span>
            </NuxtLink>
            <NuxtLink to="/match" class="nav-item" :class="{ active: isActive('/match') }">
              <Icon name="heart" size="20" />
              <span>Match</span>
            </NuxtLink>
            <NuxtLink to="/chat" class="nav-item" :class="{ active: isActive('/chat') }">
              <Icon name="message-circle" size="20" />
              <span>Chat</span>
            </NuxtLink>
            
            <!-- ✅ FIXED: Wrap notification link with badge in ClientOnly -->
            <NuxtLink to="/notifications" class="nav-item" :class="{ active: isActive('/notifications') }">
              <Icon name="bell" size="20" />
              <span>Notifications</span>
              <ClientOnly>
                <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
              </ClientOnly>
            </NuxtLink>
            
            <!-- ✅ FIXED: Wrap profile link in ClientOnly -->
            <ClientOnly>
              <NuxtLink to="/profile" class="nav-item" :class="{ active: isActive('/profile') }">
                <Icon name="user" size="20" />
                <span>Profile</span>
              </NuxtLink>
            </ClientOnly>
          </nav>
        </slot>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <button @click="toggleSidebar" class="sidebar-toggle">
            <Icon name="menu" size="24" />
          </button>
          <NuxtLink to="/feed" class="logo">
            <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
            <span class="logo-text">SocialVerse</span>
          </NuxtLink>
        </div>

        <div class="header-right">
          <slot name="header-actions">
            <!-- Default header actions -->
            <button class="icon-btn" @click="toggleSearch">
              <Icon name="search" size="20" />
            </button>
            
            <!-- ✅ FIXED: Wrap notification button with badge in ClientOnly -->
            <ClientOnly>
              <button class="icon-btn" @click="toggleNotifications">
                <Icon name="bell" size="20" />
                <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
              </button>
            </ClientOnly>
            
            <!-- ✅ FIXED: Wrap user menu button in ClientOnly -->
            <ClientOnly>
              <button class="icon-btn" @click="toggleUserMenu">
                <Icon name="user" size="20" />
              </button>
            </ClientOnly>
          </slot>
        </div>
      </header>

      <!-- Page Content -->
      <div class="page-content">
        <slot />
      </div>
    </main>

    <!-- Right Sidebar (Optional) -->
    <aside v-if="showRightSidebar" class="right-sidebar">
      <slot name="right-sidebar">
        <!-- Default right sidebar content -->
      </slot>
    </aside>

    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(false)
const showRightSidebar = ref(false)
const unreadCount = ref(0)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const toggleSearch = () => {
  // Handle search toggle
}

const toggleNotifications = () => {
  // Handle notifications toggle
}

const toggleUserMenu = () => {
  // Handle user menu toggle
}

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

// Close sidebar on route change
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background: #0fa;
  color: #e2e8f0;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background: #1e293b;
  border-right: 1px solid #155;
  overflow-y: auto;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 100;
}

.sidebar-content {
  padding: 1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap:rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.nav-item:hover {
  background: #334155;
  color: #ff5f9;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  display: none;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-weight: 600;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size:rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-btn {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  position: relative;
  transition: color 0.2s;
}

.icon-btn:hover {
  color: #f1f5f9;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.right-sidebar {
  width: px;
  background: #1e293b;
  border-left: 1px solid #334155;
  overflow-y: auto;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top:;
    height: 100vh;
    transform: translateX(-100%);
    z-index: 101;
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-toggle {
    display: block;
  }

  .right-sidebar {
    display: none;
  }

  .page-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100%;
  }

  .logo-text {
    display: none;
  }

  .app-header {
    padding: rem 1rem;
  }
}
</style>
