<!-- components/chat/ChatHeader.vue -->
<template>
  <div class="chat-header">
    <div class="header-left">
      <div class="app-logo">
        <h2>SocialVerse</h2>
      </div>
      <div class="status-indicators">
        <span class="online-count">{{ onlineCount }} online</span>
        <div class="unread-badge" v-if="unreadCount > 0">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
      </div>
    </div>

    <div class="header-center">
      <div class="search-container">
        <input
          type="text"
          placeholder="Search chats, contacts..."
          v-model="searchInput"
          @input="handleSearch"
          class="search-input"
        />
        <Icon name="search" class="search-icon" />
      </div>
    </div>

    <div class="header-right">
      <!-- Status Button -->
      <button 
        class="header-btn status-btn"
        @click="$emit('openStatus')"
        :class="{ 'has-status': user.hasActiveStatus }"
      >
        <div class="status-avatar">
          <img :src="user.avatar || '/default-avatar.png'" :alt="user.username" />
          <div class="status-indicator" v-if="user.hasActiveStatus"></div>
        </div>
      </button>

      <!-- More Menu -->
      <div class="more-menu" ref="moreMenu">
        <button class="header-btn more-btn" @click="toggleMoreMenu">
          <Icon name="more-vertical" />
        </button>
        
        <div class="dropdown-menu" v-if="showMoreMenu">
          <button @click="$emit('openSettings')" class="menu-item">
            <Icon name="settings" />
            Settings
          </button>
          <button @click="handleLogout" class="menu-item">
            <Icon name="log-out" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Icon from '@/components/ui/icon.vue'

// Props
const props = defineProps({
  user: Object,
  unreadCount: { type: Number, default: 0 },
  onlineCount: { type: Number, default: 0 }
})

// Emits
const emit = defineEmits(['search', 'openSettings', 'openStatus'])

// Router and stores
const router = useRouter()
const userStore = useUserStore()

// Reactive data
const searchInput = ref('')
const showMoreMenu = ref(false)
const moreMenu = ref(null)

// Methods
const handleSearch = () => {
  emit('search', searchInput.value)
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

const handleClickOutside = (event) => {
  if (moreMenu.value && !moreMenu.value.contains(event.target)) {
    showMoreMenu.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-logo h2 {
  margin: 0;
  color: #1976d2;
  font-size: 20px;
  font-weight: 600;
}

.status-indicators {
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-count {
  font-size: 12px;
  color: #666;
}

.unread-badge {
  background: #f44336;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 24px;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 40px 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1976d2;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 16px;
  height: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.header-btn:hover {
  background: #f5f5f5;
}

.status-btn {
  padding: 4px;
}

.status-avatar {
  position: relative;
  width: 32px;
  height: 32px;
}

.status-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.more-menu {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 150px;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item:first-child {
  border-radius: 8px 8px 0 0;
}

.menu-item:last-child {
  border-radius: 0 0 8px 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chat-header {
    padding: 8px 12px;
  }
  
  .header-center {
    margin: 0 12px;
  }
  
  .app-logo h2 {
    font-size: 18px;
  }
  
  .status-indicators {
    display: none;
  }
}
</style>
