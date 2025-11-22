<!-- components/chat/ChatListItem.vue -->
<template>
  <div 
    class="chat-list-item"
    :class="{ 
      'selected': isSelected, 
      'unread': chat.unreadCount > 0,
      'pinned': chat.isPinned,
      'muted': chat.isMuted
    }"
    @click="$emit('select', chat.id)"
    @contextmenu="$emit('contextMenu', $event, chat)"
  >
    <!-- Chat Avatar -->
    <div class="chat-avatar">
      <img 
        v-if="chat.type === 'direct'"
        :src="chat.avatar || '/default-avatar.png'" 
        :alt="chat.name"
      />
      <div v-else class="group-avatar">
        <Icon name="users" />
      </div>
      
      <!-- Online indicator for direct chats -->
      <div 
        v-if="chat.type === 'direct' && chat.isOnline" 
        class="online-indicator"
      ></div>
      
      <!-- Status indicator (blue dot) -->
      <div 
        v-if="chat.hasUnviewedStatus" 
        class="status-indicator"
      ></div>
    </div>

    <!-- Chat Info -->
    <div class="chat-info">
      <div class="chat-header">
        <div class="chat-name">
          {{ chat.name }}
          <Icon v-if="chat.isVerified" name="check-circle" class="verified-icon" />
        </div>
        <div class="chat-time">
          {{ formatTime(chat.lastMessageAt) }}
        </div>
      </div>
      
      <div class="chat-preview">
        <div class="last-message">
          <!-- Typing indicator -->
          <div v-if="chat.typingUsers && chat.typingUsers.length > 0" class="typing-indicator">
            <span class="typing-text">
              {{ getTypingText(chat.typingUsers) }}
            </span>
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          
          <!-- Last message -->
          <div v-else class="message-content">
            <span v-if="chat.lastMessage?.senderId === currentUserId" class="message-prefix">
              You: 
            </span>
            <span v-else-if="chat.type === 'group' && chat.lastMessage?.senderName" class="message-prefix">
              {{ chat.lastMessage.senderName }}: 
            </span>
            
            <span class="message-text">
              {{ getMessagePreview(chat.lastMessage) }}
            </span>
          </div>
        </div>
        
        <div class="chat-badges">
          <!-- Unread count -->
          <div v-if="chat.unreadCount > 0" class="unread-badge">
            {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
          </div>
          
          <!-- Message status icons -->
          <Icon 
            v-if="chat.lastMessage?.senderId === currentUserId && chat.lastMessage?.readAt"
            name="check-check" 
            class="read-icon"
          />
          <Icon 
            v-else-if="chat.lastMessage?.senderId === currentUserId && chat.lastMessage?.deliveredAt"
            name="check" 
            class="delivered-icon"
          />
          
          <!-- Muted icon -->
          <Icon v-if="chat.isMuted" name="volume-x" class="muted-icon" />
          
          <!-- Pinned icon -->
          <Icon v-if="chat.isPinned" name="pin" class="pinned-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { formatDistanceToNow } from 'date-fns'
import Icon from '@/components/ui/icon.vue'

// Props
const props = defineProps({
  chat: Object,
  isSelected: Boolean
})

// Emits
const emit = defineEmits(['select', 'contextMenu'])

// Stores
const userStore = useUserStore()

// Computed
const currentUserId = computed(() => userStore.user?.id)

// Methods
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

const getTypingText = (typingUsers) => {
  if (typingUsers.length === 1) {
    return `${typingUsers[0].username} is typing`
  } else if (typingUsers.length === 2) {
    return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`
  } else {
    return `${typingUsers.length} people are typing`
  }
}

const getMessagePreview = (message) => {
  if (!message) return 'No messages yet'
  
  if (message.isDeleted) return 'This message was deleted'
  
  switch (message.messageType) {
    case 'text':
      return message.content || ''
    case 'image':
      return '📷 Photo'
    case 'video':
      return '🎥 Video'
    case 'audio':
      return '🎵 Audio'
    case 'voice_note':
      return '🎤 Voice message'
    case 'file':
      return '📎 File'
    case 'system':
      return message.content || ''
    default:
      return 'Message'
  }
}
</script>

<style scoped>
.chat-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.chat-list-item:hover {
  background: #f5f5f5;
}

.chat-list-item.selected {
  background: #e3f2fd;
  border-left-color: #1976d2;
}

.chat-list-item.unread {
  background: #fafafa;
}

.chat-list-item.pinned {
  background: #fff3e0;
}

.chat-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.chat-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.group-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.status-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #2196f3;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chat-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: #333;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verified-icon {
  width: 14px;
  height: 14px;
  color: #1976d2;
  flex-shrink: 0;
}

.chat-time {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.chat-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.last-message {
  flex: 1;
  min-width: 0;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1976d2;
  font-size: 13px;
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dots span {
  width: 4px;
  height: 4px;
  background: #1976d2;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.message-content {
  display: flex;
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-prefix {
  color: #999;
  flex-shrink: 0;
}

.message-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.unread-badge {
  background: #f44336;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.read-icon {
  width: 14px;
  height: 14px;
  color: #4caf50;
}

.delivered-icon {
  width: 14px;
  height: 14px;
  color: #999;
}

.muted-icon,
.pinned-icon {
  width: 12px;
  height: 12px;
  color: #999;
}

/* Unread styling */
.chat-list-item.unread .chat-name {
  font-weight: 600;
  color: #000;
}

.chat-list-item.unread .message-content {
  font-weight: 500;
  color: #333;
}

/* Muted styling */
.chat-list-item.muted {
  opacity: 0.7;
}
</style>
