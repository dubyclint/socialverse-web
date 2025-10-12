<template>
  <div class="manager-layout">
    <nav class="manager-sidebar">
      <div class="sidebar-header">
        <h2>Manager Panel</h2>
        <p>{{ user?.name }}</p>
      </div>
      
      <ul class="nav-menu">
        <li>
          <NuxtLink to="/manager/dashboard" class="nav-link">
            <Icon name="home" />
            Dashboard
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/manager/users" class="nav-link">
            <Icon name="users" />
            User Management
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/manager/reports" class="nav-link">
            <Icon name="flag" />
            Reports
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/manager/content" class="nav-link">
            <Icon name="file-text" />
            Content Moderation
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/manager/analytics" class="nav-link">
            <Icon name="bar-chart" />
            Analytics
          </NuxtLink>
        </li>
      </ul>
      
      <div class="sidebar-footer">
        <button @click="logout" class="logout-btn">
          <Icon name="log-out" />
          Logout
        </button>
      </div>
    </nav>
    
    <main class="manager-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
const user = useAuthUser()

const logout = async () => {
  await navigateTo('/auth/logout')
}
</script>

<style scoped>
.manager-layout {
  display: flex;
  min-height: 100vh;
}

.manager-sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid #34495e;
}

.sidebar-header h2 {
  margin-bottom: 0.5rem;
}

.sidebar-header p {
  color: #bdc3c7;
  font-size: 0.9rem;
}

.nav-menu {
  flex: 1;
  list-style: none;
  padding: 1rem 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  color: #ecf0f1;
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: #34495e;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #34495e;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid #34495e;
  color: #ecf0f1;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: #e74c3c;
}

.manager-content {
  flex: 1;
  background: #f8f9fa;
  overflow-y: auto;
}
</style>
