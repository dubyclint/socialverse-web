<template>
  <header class="app-header">
    <nav class="nav-container">
      <NuxtLink to="/" class="logo">
        <Icon name="zap" size="24" />
        SocialVerse
      </NuxtLink>
      
      <div class="nav-links">
        <NuxtLink to="/feed" class="nav-link">
          <Icon name="home" size="18" />
          <span>Feed</span>
        </NuxtLink>
        <NuxtLink to="/explore" class="nav-link">
          <Icon name="compass" size="18" />
          <span>Explore</span>
        </NuxtLink>
        <NuxtLink to="/chat" class="nav-link">
          <Icon name="message-circle" size="18" />
          <span>Chat</span>
        </NuxtLink>
        <NuxtLink to="/trade" class="nav-link">
          <Icon name="shopping-cart" size="18" />
          <span>Trade</span>
        </NuxtLink>
        <NuxtLink to="/p2p" class="nav-link">
          <Icon name="users" size="18" />
          <span>P2P</span>
        </NuxtLink>
        <NuxtLink to="/escrow" class="nav-link">
          <Icon name="shield" size="18" />
          <span>Escrow</span>
        </NuxtLink>
      </div>

      <div class="nav-actions">
        <!-- Wallet Widget -->
        <WalletWidget v-if="user" />
        
        <!-- User Menu -->
        <div v-if="user" class="user-menu">
          <button @click="showUserMenu = !showUserMenu" class="user-button">
            <img 
              :src="user.user_metadata?.avatar_url || '/default-avatar.png'" 
              :alt="user.user_metadata?.name || 'User'"
              class="user-avatar"
            />
            <span class="user-name">{{ user.user_metadata?.name || user.email }}</span>
            <Icon name="chevron-down" size="16" />
          </button>
          
          <div v-if="showUserMenu" class="user-dropdown">
            <NuxtLink to="/profile" class="dropdown-item">
              <Icon name="user" size="16" />
              Profile
            </NuxtLink>
            <NuxtLink to="/inbox" class="dropdown-item">
              <Icon name="inbox" size="16" />
              Inbox
            </NuxtLink>
            <div class="dropdown-divider"></div>
            <button @click="signOut" class="dropdown-item">
              <Icon name="log-out" size="16" />
              Sign Out
            </button>
          </div>
        </div>
        
        <!-- Auth Buttons -->
        <div v-else class="auth-buttons">
          <NuxtLink to="/auth" class="btn-secondary">Sign In</NuxtLink>
          <NuxtLink to="/auth?mode=signup" class="btn-primary">Sign Up</NuxtLink>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import WalletWidget from './WalletWidget.vue'

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const showUserMenu = ref(false)

const signOut = async () => {
  await supabase.auth.signOut()
  showUserMenu.value = false
  await navigateTo('/')
}

// Close user menu when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.user-menu')) {
    showUserMenu.value = false
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
.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  text-decoration: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: #4a5568;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-link:hover {
  background: #f7fafc;
  color: #2d3748;
}

.nav-link.router-link-active {
  background: #e6fffa;
  color: #234e52;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  color: #2d3748;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 0.5rem;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #4a5568;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.dropdown-item:hover {
  background: #f7fafc;
  color: #2d3748;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.5rem 0;
}

.auth-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3182ce;
  color: white;
  border: 1px solid #3182ce;
}

.btn-primary:hover {
  background: #2c5282;
  border-color: #2c5282;
}

.btn-secondary {
  background: white;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 1rem;
  }
  
  .nav-links {
    display: none;
  }
  
  .user-name {
    display: none;
  }
}
</style>
