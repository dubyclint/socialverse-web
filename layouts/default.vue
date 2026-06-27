<!-- FILE: /layouts/default.vue - COMPLETE MOBILE RESPONSIVE FIX -->
<!-- ============================================================================
     DEFAULT LAYOUT - MOBILE RESPONSIVE VERSION
     ✅ FIXED: All CSS broken values corrected
     ✅ FIXED: Missing imports added
     ✅ FIXED: Mobile-first responsive design
     ✅ FIXED: Proper sidebar behavior on all devices
     ✅ FIXED: Touch-friendly button sizes
     ✅ FIXED: Tailwind utility classes integrated
     ============================================================================ -->

<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <NuxtLink to="/feed" class="sidebar-logo">
          <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
          <span class="logo-text">SocialVerse</span>
        </NuxtLink>
        <button @click="closeSidebar" class="sidebar-close md:hidden">
          <Icon name="x" size="24" />
        </button>
      </div>

      <div class="sidebar-content">
        <slot name="sidebar">
          <!-- Default sidebar content -->
          <nav class="sidebar-nav">
            <NuxtLink 
              to="/feed" 
              class="nav-item" 
              :class="{ active: isActive('/feed') }"
              @click="closeSidebar"
            >
              <Icon name="home" size="20" />
              <span>Feed</span>
            </NuxtLink>

            <NuxtLink 
              to="/explore" 
              class="nav-item" 
              :class="{ active: isActive('/explore') }"
              @click="closeSidebar"
            >
              <Icon name="compass" size="20" />
              <span>Explore</span>
            </NuxtLink>

            <NuxtLink 
              to="/match" 
              class="nav-item" 
              :class="{ active: isActive('/match') }"
              @click="closeSidebar"
            >
              <Icon name="heart" size="20" />
              <span>Match</span>
            </NuxtLink>

            <NuxtLink 
              to="/chat" 
              class="nav-item" 
              :class="{ active: isActive('/chat') }"
              @click="closeSidebar"
            >
              <Icon name="message-circle" size="20" />
              <span>Chat</span>
            </NuxtLink>
            
            <!-- ✅ FIXED: Wrap notification link with badge in ClientOnly -->
            <NuxtLink 
              to="/notifications" 
              class="nav-item" 
              :class="{ active: isActive('/notifications') }"
              @click="closeSidebar"
            >
              <Icon name="bell" size="20" />
              <span>Notifications</span>
              <ClientOnly>
                <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
              </ClientOnly>
            </NuxtLink>
            
            <!-- ✅ FIXED: Wrap profile link in ClientOnly -->
            <ClientOnly>
              <NuxtLink 
                to="/profile" 
                class="nav-item" 
                :class="{ active: isActive('/profile') }"
                @click="closeSidebar"
              >
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
          <button @click="toggleSidebar" class="sidebar-toggle lg:hidden">
            <Icon name="menu" size="24" />
          </button>
          <NuxtLink to="/feed" class="logo hidden sm:flex">
            <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
            <span class="logo-text">SocialVerse</span>
          </NuxtLink>
        </div>

        <div class="header-right">
          <slot name="header-actions">
            <!-- Default header actions -->
            <button class="icon-btn hidden sm:flex" @click="toggleSearch">
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
    <aside v-if="showRightSidebar" class="right-sidebar hidden lg:block">
      <slot name="right-sidebar">
        <!-- Default right sidebar content -->
      </slot>
    </aside>

    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// ============================================================================
// SETUP & INITIALIZATION
// ============================================================================
const route = useRoute()
const sidebarOpen = ref(false)
const showRightSidebar = ref(false)
const unreadCount = ref(0)

// ============================================================================
// METHODS
// ============================================================================
const toggleSidebar = () => {
  console.log('[Layout] Toggle sidebar')
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  console.log('[Layout] Close sidebar')
  sidebarOpen.value = false
}

const toggleSearch = () => {
  console.log('[Layout] Toggle search')
  // Handle search toggle
}

const toggleNotifications = () => {
  console.log('[Layout] Toggle notifications')
  // Handle notifications toggle
}

const toggleUserMenu = () => {
  console.log('[Layout] Toggle user menu')
  // Handle user menu toggle
}

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

// ============================================================================
// WATCHERS - Close sidebar on route change
// ============================================================================
watch(() => route.path, () => {
  console.log('[Layout] Route changed, closing sidebar')
  sidebarOpen.value = false
})
</script>

<style scoped>
/* ============================================================================
   GLOBAL LAYOUT - MOBILE FIRST
   ============================================================================ */
.app-layout {
  display: flex;
  height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  overflow: hidden;
}

/* ============================================================================
   SIDEBAR - MOBILE FIRST RESPONSIVE
   ============================================================================ */
.sidebar {
  width: 100%;
  max-width: 280px;
  background: #1e293b;
  border-right: 1px solid #334155;
  overflow-y: auto;
  transition: transform 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 101;
  transform: translateX(-100%);
}

.sidebar.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #334155;
  gap: 1rem;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-weight: 600;
  flex: 1;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 1rem;
}

.sidebar-close {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.sidebar-close:hover {
  color: #60a5fa;
}

.sidebar-content {
  padding: 1rem 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
  margin: 0 0.5rem;
  font-size: 0.95rem;
}

.nav-item:hover {
  background: #334155;
  color: #60a5fa;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

/* ============================================================================
   MAIN CONTENT
   ============================================================================ */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
}

/* ============================================================================
   HEADER - MOBILE FIRST RESPONSIVE
   ============================================================================ */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  height: auto;
  min-height: 56px;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  min-width: 44px;
  min-height: 44px;
}

.sidebar-toggle:hover {
  color: #60a5fa;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  position: relative;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.icon-btn:hover {
  color: #60a5fa;
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

/* ============================================================================
   PAGE CONTENT - MOBILE FIRST RESPONSIVE
   ============================================================================ */
.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  width: 100%;
}

/* ============================================================================
   RIGHT SIDEBAR
   ============================================================================ */
.right-sidebar {
  width: 320px;
  background: #1e293b;
  border-left: 1px solid #334155;
  overflow-y: auto;
}

/* ============================================================================
   SIDEBAR OVERLAY
   ============================================================================ */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

/* ============================================================================
   RESPONSIVE BREAKPOINTS
   ============================================================================ */

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .sidebar {
    position: relative;
    transform: translateX(0);
    width: 280px;
    height: 100%;
  }

  .sidebar-overlay {
    display: none;
  }

  .sidebar-close {
    display: none;
  }

  .page-content {
    padding: 1.5rem;
  }

  .app-header {
    padding: 1rem 1.5rem;
    min-height: 60px;
  }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .app-layout {
    gap: 0;
  }

  .page-content {
    padding: 2rem;
  }

  .app-header {
    padding: 1rem 2rem;
  }
}

/* Large Desktop (1280px and up) */
@media (min-width: 1280px) {
  .page-content {
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* ============================================================================
   SCROLLBAR STYLING
   ============================================================================ */
.sidebar::-webkit-scrollbar,
.page-content::-webkit-scrollbar,
.right-sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track,
.page-content::-webkit-scrollbar-track,
.right-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb,
.page-content::-webkit-scrollbar-thumb,
.right-sidebar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover,
.page-content::-webkit-scrollbar-thumb:hover,
.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* ============================================================================
   ACCESSIBILITY
   ============================================================================ */
button:focus-visible,
a:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ============================================================================
   REDUCED MOTION SUPPORT
   ============================================================================ */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-item,
  .icon-btn {
    transition: none;
  }
}
</style>
