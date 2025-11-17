<!-- FILE: /layouts/manager.vue - MANAGER PANEL LAYOUT -->
<!-- ============================================================================
     MANAGER LAYOUT - Used for manager/admin pages
     Includes: Manager sidebar, header, and main content area
     ============================================================================ -->

<template>
  <div class="manager-layout">
    <!-- Manager Sidebar -->
    <aside class="manager-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <NuxtLink to="/manager" class="logo">
          <Icon name="settings" size="24" />
          <span>Manager Panel</span>
        </NuxtLink>
        <button @click="sidebarOpen = false" class="close-btn">
          <Icon name="x" size="20" />
        </button>
      </div>

      <nav class="nav-menu">
        <NuxtLink to="/manager" class="nav-link" :class="{ active: isActive('/manager') }">
          <Icon name="home" size="20" />
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/admin" class="nav-link" :class="{ active: isActive('/admin') }">
          <Icon name="shield" size="20" />
          <span>Admin Panel</span>
        </NuxtLink>
        <NuxtLink to="/admin/users" class="nav-link" :class="{ active: isActive('/admin/users') }">
          <Icon name="users" size="20" />
          <span>Users</span>
        </NuxtLink>
        <NuxtLink to="/admin/analytics" class="nav-link" :class="{ active: isActive('/admin/analytics') }">
          <Icon name="bar-chart-2" size="20" />
          <span>Analytics</span>
        </NuxtLink>
        <NuxtLink to="/admin/security" class="nav-link" :class="{ active: isActive('/admin/security') }">
          <Icon name="lock" size="20" />
          <span>Security</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn">
          <Icon name="log-out" size="20" />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="manager-main">
      <!-- Header -->
      <header class="manager-header">
        <button @click="toggleSidebar" class="sidebar-toggle">
          <Icon name="menu" size="24" />
        </button>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="header-actions">
          <button class="icon-btn">
            <Icon name="bell" size="20" />
          </button>
          <button class="icon-btn" @click="toggleUserMenu">
            <Icon name="user" size="20" />
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <div class="manager-content">
        <slot />
      </div>
    </main>

    <!-- Sidebar Overlay (Mobile) -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/manager': 'Manager Dashboard',
    '/admin': 'Admin Panel',
    '/admin/users': 'User Management',
    '/admin/analytics': 'Analytics',
    '/admin/security': 'Security',
  }
  return titles[route.path] || 'Manager Panel'
})

const toggleUserMenu = () => {
  // Handle user menu toggle
}

const logout = async () => {
  // Handle logout
  await router.push('/auth/signin')
}

// Close sidebar on route change
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<style scoped>
.manager-layout {
  display: flex;
  height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  overflow: hidden;
}

/* Sidebar */
.manager-sidebar {
  width: 280px;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: transform 0.3s ease;
  z-index: 100;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #334155;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  display: none;
}

.nav-menu {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  margin: 0 0.5rem;
  border-radius: 8px;
}

.nav-link:hover {
  background: #334155;
  color: #f1f5f9;
}

.nav-link.active {
  background: #3b82f6;
  color: white;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #334155;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #dc2626;
}

/* Main Content */
.manager-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  height: 60px;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  padding: 0.5rem;
  display: none;
}

.page-title {
  flex: 1;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-actions {
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
  transition: color 0.2s;
}

.icon-btn:hover {
  color: #f1f5f9;
}

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
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
  .manager-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    transform: translateX(-100%);
    z-index: 101;
  }

  .manager-sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-toggle {
    display: block;
  }

  .close-btn {
    display: block;
  }

  .manager-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .manager-sidebar {
    width: 100%;
  }

  .manager-header {
    padding: 0.75rem 1rem;
  }

  .page-title {
    font-size: 1rem;
  }
}
</style>
