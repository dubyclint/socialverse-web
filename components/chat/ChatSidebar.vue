<!-- components/chat/ChatSidebar.vue -->
<template>
  <div class="chat-sidebar">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="header-tabs">
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'chats' }"
          @click="activeTab = 'chats'"
        >
          <Icon name="message-circle" />
          Chats
          <span class="tab-badge" v-if="unreadChatsCount > 0">{{ unreadChatsCount }}</span>
        </button>
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'status' }"
          @click="activeTab = 'status'"
        >
          <Icon name="circle" />
          Status
          <span class="tab-badge" v-if="unviewedStatusCount > 0">{{ unviewedStatusCount }}</span>
        </button>
        <button 
          class="tab-btn"
          :class="{ active: activeTab === 'calls' }"
          @click="activeTab = 'calls'"
        >
          <Icon name="phone" />
          Calls
          <span class="tab-badge" v-if="missedCallsCount > 0">{{ missedCallsCount }}</span>
        </button>
      </div>

      <!-- More Menu (Kebab) -->
      <div class="more-menu" ref="moreMenu">
        <button class="more-btn" @click="toggleMoreMenu">
          <Icon name="more-vertical" />
        </button>
        
        <div class="dropdown-menu" v-if="showMoreMenu">
          <button @click="$emit('createGroup')" class="menu-item">
            <Icon name="users" />
            New Group
          </button>
          <button @click="$emit('newAnnouncement')" class="menu-item">
            <Icon name="megaphone" />
            New Announcement
          </button>
          <button @click="showContactSync = true" class="menu-item">
            <Icon name="user-plus" />
            Sync Contacts
          </button>
        </div>
      </div>
    </div>

    <!-- Chat List -->
    <div class="chat-list" v-if="activeTab === 'chats'">
      <!-- Pinned/Favorite Chats -->
      <div class="chat-section" v-if="pinnedChats.length > 0">
        <div class="section-header">
          <span>Pinned</span>
        </div>
        <ChatListItem
          v-for="chat in pinnedChats"
          :key="chat.id"
          :chat="chat"
          :isSelected="selectedChatId === chat.id"
          @select="$emit('selectChat', chat.id)"
          @contextMenu="handleChatContextMenu"
        />
      </div>

      <!-- Unread Chats -->
      <div class="chat-section" v-if="unreadChats.length > 0">
        <div class="section-header">
          <span>Unread</span>
        </div>
        <ChatListItem
          v-for="chat in unreadChats"
          :key="chat.id"
          :chat="chat"
          :isSelected="selectedChatId === chat.id"
          @select="$emit('selectChat', chat.id)"
          @contextMenu="handleChatContextMenu"
        />
      </div>

      <!-- Online Pals -->
      <div class="chat-section" v-if="onlineChats.length > 0">
        <div class="section-header">
          <span>Online</span>
        </div>
        <ChatListItem
          v-for="chat in onlineChats"
          :key="chat.id"
          :chat="chat"
          :isSelected="selectedChatId === chat.id"
          @select="$emit('selectChat', chat.id)"
          @contextMenu="handleChatContextMenu"
        />
      </div>

      <!-- Group Chats -->
      <div class="chat-section" v-if="groupChats.length > 0">
        <div class="section-header">
          <span>Groups</span>
        </div>
        <ChatListItem
          v-for="chat in groupChats"
          :key="chat.id"
          :chat="chat"
          :isSelected="selectedChatId === chat.id"
          @select="$emit('selectChat', chat.id)"
          @contextMenu="handleChatContextMenu"
        />
      </div>

      <!-- All Other Chats -->
      <div class="chat-section">
        <ChatListItem
          v-for="chat in otherChats"
          :key="chat.id"
          :chat="chat"
          :isSelected="selectedChatId === chat.id"
          @select="$emit('selectChat', chat.id)"
          @contextMenu="handleChatContextMenu"
        />
      </div>
    </div>

    <!-- Status List -->
    <div class="status-list" v-if="activeTab === 'status'">
      <!-- My Status -->
      <div class="my-status-section">
        <div class="my-status-item" @click="viewMyStatus">
          <div class="status-avatar">
            <img :src="currentUser.avatar || '/default-avatar.png'" :alt="currentUser.username" />
            <div class="add-status-btn" v-if="!currentUser.hasActiveStatus">
              <Icon name="plus" />
            </div>
          </div>
          <div class="status-info">
            <div class="status-name">My Status</div>
            <div class="status-time" v-if="currentUser.hasActiveStatus">
              {{ currentUser.lastStatusTime }}
            </div>
            <div class="status-time" v-else>
              Tap to add status update
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Updates -->
      <div class="status-section" v-if="recentStatusUpdates.length > 0">
        <div class="section-header">
          <span>Recent updates</span>
        </div>
        <StatusListItem
          v-for="status in recentStatusUpdates"
          :key="status.userId"
          :status="status"
          @view="viewUserStatus"
        />
      </div>

      <!-- Viewed Updates -->
      <div class="status-section" v-if="viewedStatusUpdates.length > 0">
        <div class="section-header">
          <span>Viewed updates</span>
        </div>
        <StatusListItem
          v-for="status in viewedStatusUpdates"
          :key="status.userId"
          :status="status"
          @view="viewUserStatus"
        />
      </div>
    </div>

    <!-- Call History -->
    <div class="call-list" v-if="activeTab === 'calls'">
      <CallHistoryItem
        v-for="call in callHistory"
        :key="call.id"
        :call="call"
        @callback="handleCallback"
      />
    </div>

    <!-- Contact Sync Modal -->
    <ContactSyncModal
      v-if="showContactSync"
      @close="showContactSync = false"
      @synced="handleContactsSynced"
    />

    <!-- Context Menu -->
    <ContextMenu
      v-if="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
      @select="handleContextMenuSelect"
      @close="contextMenu.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import Icon from '@/components/ui/Icon.vue'
import ChatListItem from './ChatListItem.vue'
import StatusListItem from './StatusListItem.vue'
import CallHistoryItem from './CallHistoryItem.vue'
import ContactSyncModal from './ContactSyncModal.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'

// Props
const props = defineProps({
  chats: { type: Array, default: () => [] },
  selectedChatId: String,
  searchQuery: String,
  onlinePals: { type: Array, default: () => [] },
  statusUsers: { type: Array, default: () => [] }
})

// Emits
const emit = defineEmits(['selectChat', 'createGroup', 'newAnnouncement'])

// Stores
const userStore = useUserStore()

// Reactive data
const activeTab = ref('chats')
const showMoreMenu = ref(false)
const showContactSync = ref(false)
const moreMenu = ref(null)
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  items: [],
  chatId: null
})

// Computed properties
const currentUser = computed(() => userStore.user)

const filteredChats = computed(() => {
  if (!props.searchQuery) return props.chats
  
  return props.chats.filter(chat => 
    chat.name?.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
    chat.lastMessage?.content?.toLowerCase().includes(props.searchQuery.toLowerCase())
  )
})

const pinnedChats = computed(() => 
  filteredChats.value.filter(chat => chat.isPinned)
)

const unreadChats = computed(() => 
  filteredChats.value.filter(chat => chat.unreadCount > 0 && !chat.isPinned)
)

const onlineChats = computed(() => 
  filteredChats.value.filter(chat => 
    chat.type === 'direct' && 
    chat.isOnline && 
    chat.unreadCount === 0 && 
    !chat.isPinned
  )
)

const groupChats = computed(() => 
  filteredChats.value.filter(chat => 
    chat.type === 'group' && 
    chat.unreadCount === 0 && 
    !chat.isPinned
  )
)

const otherChats = computed(() => 
  filteredChats.value.filter(chat => 
    !chat.isPinned && 
    chat.unreadCount === 0 && 
    !(chat.type === 'direct' && chat.isOnline) &&
    !(chat.type === 'group')
  )
)

const unreadChatsCount = computed(() => 
  props.chats.reduce((count, chat) => count + (chat.unreadCount > 0 ? 1 : 0), 0)
)

const recentStatusUpdates = computed(() => 
  props.statusUsers.filter(user => user.hasUnviewed)
)

const viewedStatusUpdates = computed(() => 
  props.statusUsers.filter(user => !user.hasUnviewed)
)

const unviewedStatusCount = computed(() => recentStatusUpdates.value.length)

const callHistory = computed(() => {
  // This would come from
<!-- components/chat/ChatSidebar.vue (continued) -->
<script setup>
// ... previous code ...

const callHistory = computed(() => {
  // This would come from call store
  return userStore.callHistory || []
})

const missedCallsCount = computed(() => 
  callHistory.value.filter(call => call.status === 'missed' && !call.isViewed).length
)

// Methods
const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const handleChatContextMenu = (event, chat) => {
  event.preventDefault()
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    chatId: chat.id,
    items: [
      { id: 'pin', label: chat.isPinned ? 'Unpin Chat' : 'Pin Chat', icon: 'pin' },
      { id: 'mute', label: chat.isMuted ? 'Unmute' : 'Mute', icon: 'volume-x' },
      { id: 'archive', label: 'Archive Chat', icon: 'archive' },
      { id: 'delete', label: 'Delete Chat', icon: 'trash-2', danger: true }
    ]
  }
}

const handleContextMenuSelect = (itemId) => {
  const chatId = contextMenu.value.chatId
  
  switch (itemId) {
    case 'pin':
      // Toggle pin status
      break
    case 'mute':
      // Toggle mute status
      break
    case 'archive':
      // Archive chat
      break
    case 'delete':
      // Delete chat
      break
  }
  
  contextMenu.value.show = false
}

const viewMyStatus = () => {
  // Navigate to my status view or create new status
  if (currentUser.value.hasActiveStatus) {
    // View my status
  } else {
    // Create new status
    emit('openStatus')
  }
}

const viewUserStatus = (status) => {
  // Navigate to user status view
  console.log('View status for user:', status.userId)
}

const handleCallback = (call) => {
  // Initiate callback
  console.log('Callback to:', call.contactId)
}

const handleContactsSynced = (results) => {
  console.log('Contacts synced:', results)
  showContactSync.value = false
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
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.header-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
  position: relative;
}

.tab-btn.active {
  background: #e3f2fd;
  color: #1976d2;
}

.tab-btn:hover:not(.active) {
  background: #f5f5f5;
}

.tab-badge {
  background: #f44336;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.more-menu {
  position: relative;
}

.more-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.more-btn:hover {
  background: #f5f5f5;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
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

.chat-list,
.status-list,
.call-list {
  flex: 1;
  overflow-y: auto;
}

.chat-section,
.status-section {
  margin-bottom: 8px;
}

.section-header {
  padding: 8px 16px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.my-status-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.my-status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.my-status-item:hover {
  background: #f5f5f5;
}

.status-avatar {
  position: relative;
  width: 48px;
  height: 48px;
}

.status-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.add-status-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.status-info {
  flex: 1;
}

.status-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.status-time {
  font-size: 12px;
  color: #666;
}

/* Scrollbar styling */
.chat-list::-webkit-scrollbar,
.status-list::-webkit-scrollbar,
.call-list::-webkit-scrollbar {
  width: 4px;
}

.chat-list::-webkit-scrollbar-track,
.status-list::-webkit-scrollbar-track,
.call-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list::-webkit-scrollbar-thumb,
.status-list::-webkit-scrollbar-thumb,
.call-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}

.chat-list::-webkit-scrollbar-thumb:hover,
.status-list::-webkit-scrollbar-thumb:hover,
.call-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
