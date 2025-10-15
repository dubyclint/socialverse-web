<!-- components/streaming/StreamChat.vue -->
<template>
  <div class="stream-chat-container">
    <!-- Chat Header -->
    <div class="chat-header">
      <h3 class="chat-title">
        <Icon name="mdi:chat" />
        Live Chat
      </h3>
      <div class="chat-actions">
        <button @click="toggleChatSettings" class="chat-action-btn">
          <Icon name="mdi:cog" />
        </button>
        <button @click="toggleChat" class="chat-action-btn">
          <Icon :name="isChatVisible ? 'mdi:eye-off' : 'mdi:eye'" />
        </button>
      </div>
    </div>

    <!-- Chat Messages -->
    <div 
      v-show="isChatVisible"
      ref="chatContainer" 
      class="chat-messages"
      @scroll="handleScroll"
    >
      <div v-if="isLoading" class="chat-loading">
        <div class="loading-spinner"></div>
        <p>Loading chat...</p>
      </div>

      <div v-for="message in messages" :key="message.id" class="chat-message" :class="getMessageClass(message)">
        <!-- System Messages -->
        <div v-if="message.messageType === 'system'" class="system-message">
          <Icon name="mdi:information" />
          <span>{{ message.message }}</span>
        </div>

        <!-- PewGift Messages -->
        <div v-else-if="message.messageType === 'pewgift'" class="pewgift-message">
          <div class="pewgift-animation">
            <img :src="message.pewGiftData.giftImage" :alt="message.pewGiftData.giftName" class="gift-icon" />
            <div class="pewgift-info">
              <div class="pewgift-header">
                <img :src="message.userAvatar" :alt="message.username" class="user-avatar" />
                <span class="username" :class="getUsernameClass(message)">{{ message.username }}</span>
                <div class="user-badges">
                  <span v-for="badge in message.userBadges" :key="badge" class="badge" :class="badge">
                    {{ getBadgeIcon(badge) }}
                  </span>
                </div>
              </div>
              <div class="pewgift-content">
                <span class="gift-text">sent {{ message.pewGiftData.quantity }}x {{ message.pewGiftData.giftName }}</span>
                <span class="gift-value">${{ message.pewGiftData.giftValue * message.pewGiftData.quantity }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Regular Chat Messages -->
        <div v-else class="regular-message">
          <div class="message-header">
            <img :src="message.userAvatar" :alt="message.username" class="user-avatar" />
            <span class="username" :class="getUsernameClass(message)">{{ message.username }}</span>
            <div class="user-badges">
              <span v-for="badge in message.userBadges" :key="badge" class="badge" :class="badge">
                {{ getBadgeIcon(badge) }}
              </span>
            </div>
            <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">
            <p>{{ message.message }}</p>
            <!-- Message Reactions -->
            <div v-if="message.reactions && message.reactions.length > 0" class="message-reactions">
              <button 
                v-for="reaction in getUniqueReactions(message.reactions)" 
                :key="reaction.emoji"
                @click="toggleReaction(message.id, reaction.emoji)"
                class="reaction-btn"
                :class="{ active: hasUserReacted(message.reactions, reaction.emoji) }"
              >
                {{ reaction.emoji }} {{ reaction.count }}
              </button>
            </div>
          </div>
          <!-- Message Actions -->
          <div class="message-actions" v-if="canModerateMessage(message)">
            <button @click="pinMessage(message.id)" class="action-btn" :class="{ active: message.isPinned }">
              <Icon name="mdi:pin" />
            </button>
            <button @click="deleteMessage(message.id)" class="action-btn delete">
              <Icon name="mdi:delete" />
            </button>
          </div>
        </div>
      </div>

      <!-- Typing Indicators -->
      <div v-if="typingUsers.length > 0" class="typing-indicators">
        <div class="typing-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="typing-text">
          {{ getTypingText() }}
        </span>
      </div>
    </div>

    <!-- Pinned Message -->
    <div v-if="pinnedMessage" class="pinned-message">
      <Icon name="mdi:pin" />
      <div class="pinned-content">
        <span class="pinned-username">{{ pinnedMessage.username }}</span>
        <span class="pinned-text">{{ pinnedMessage.message }}</span>
      </div>
      <button @click="unpinMessage" class="unpin-btn">
        <Icon name="mdi:close" />
      </button>
    </div>

    <!-- Chat Input -->
    <div v-show="isChatVisible" class="chat-input-container">
      <!-- Reaction Buttons -->
      <div class="quick-reactions">
        <button 
          v-for="emoji in quickReactions" 
          :key="emoji"
          @click="sendReaction(emoji)"
          class="reaction-quick-btn"
        >
          {{ emoji }}
        </button>
      </div>

      <!-- Message Input -->
      <div class="message-input-wrapper">
        <input
          v-model="newMessage"
          @keydown.enter="sendMessage"
          @input="handleTyping"
          :placeholder="chatPlaceholder"
          :disabled="!canSendMessage"
          class="message-input"
          maxlength="500"
        />
        <button 
          @click="sendMessage" 
          :disabled="!canSendMessage || !newMessage.trim()"
          class="send-btn"
        >
          <Icon name="mdi:send" />
        </button>
      </div>

      <!-- Character Counter -->
      <div class="char-counter" :class="{ warning: newMessage.length > 400 }">
        {{ newMessage.length }}/500
      </div>
    </div>

    <!-- Chat Settings Modal -->
    <div v-if="showChatSettings" class="chat-settings-modal" @click.self="toggleChatSettings">
      <div class="settings-content">
        <h4>Chat Settings</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="settings.showTimestamps" />
            Show timestamps
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="settings.showAvatars" />
            Show avatars
          </label>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="settings.enableSounds" />
            Enable sounds
          </label>
        </div>
        <div class="setting-item">
          <label>
            Font size:
            <select v-model="settings.fontSize">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </label>
        </div>
        <button @click="toggleChatSettings" class="close-settings-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useStreaming } from '~/composables/useStreaming'
import { useAuth } from '~/composables/useAuth'

interface Props {
  streamId: string
  isStreamer?: boolean
  isModerator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreamer: false,
  isModerator: false
})

const emit = defineEmits(['reaction-sent', 'message-sent'])

// Composables
const { user } = useAuth()
const { 
  messages, 
  sendChatMessage, 
  sendStreamReaction, 
  typingUsers,
  isConnected 
} = useStreaming()

// Refs
const chatContainer = ref<HTMLElement>()
const newMessage = ref('')
const isChatVisible = ref(true)
const isLoading = ref(false)
const showChatSettings = ref(false)
const isTyping = ref(false)
const pinnedMessage = ref(null)

// Settings
const settings = ref({
  showTimestamps: true,
  showAvatars: true,
  enableSounds: true,
  fontSize: 'medium'
})

// Quick reactions
const quickReactions = ['❤️', '😂', '👏', '🔥', '😮', '👍']

// Computed
const canSendMessage = computed(() => {
  return isConnected.value && user.value && newMessage.value.trim().length > 0
})

const chatPlaceholder = computed(() => {
  if (!isConnected.value) return 'Connecting...'
  if (!user.value) return 'Login to chat'
  return 'Type a message...'
})

// Methods
const sendMessage = async () => {
  if (!canSendMessage.value) return

  const message = newMessage.value.trim()
  if (!message) return

  try {
    await sendChatMessage(props.streamId, message)
    newMessage.value = ''
    emit('message-sent', message)
    
    // Scroll to bottom
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

const sendReaction = async (emoji: string) => {
  try {
    await sendStreamReaction(props.streamId, emoji)
    emit('reaction-sent', emoji)
  } catch (error) {
    console.error('Failed to send reaction:', error)
  }
}

const handleTyping = () => {
  if (!isTyping.value) {
    isTyping.value = true
    // Send typing indicator
    // Implementation depends on your WebSocket setup
    
    setTimeout(() => {
      isTyping.value = false
    }, 3000)
  }
}

const toggleChat = () => {
  isChatVisible.value = !isChatVisible.value
}

const toggleChatSettings = () => {
  showChatSettings.value = !showChatSettings.value
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const handleScroll = () => {
  // Auto-scroll logic can be implemented here
}

const getMessageClass = (message: any) => {
  return {
    'own-message': message.userId === user.value?.id,
    'streamer-message': message.userBadges?.includes('streamer'),
    'moderator-message': message.userBadges?.includes('moderator'),
    'pinned': message.isPinned
  }
}

const getUsernameClass = (message: any) => {
  return {
    'streamer': message.userBadges?.includes('streamer'),
    'moderator': message.userBadges?.includes('moderator'),
    'verified': message.userBadges?.includes('verified')
  }
}

const getBadgeIcon = (badge: string) => {
  const badges = {
    'streamer': '👑',
    'moderator': '🛡️',
    'verified': '✓',
    'subscriber': '⭐'
  }
  return badges[badge] || ''
}

const canModerateMessage = (message: any) => {
  return props.isStreamer || props.isModerator || message.userId === user.value?.id
}

const pinMessage = async (messageId: string) => {
  // Implementation for pinning messages
  console.log('Pin message:', messageId)
}

const unpinMessage = async () => {
  pinnedMessage.value = null
}

const deleteMessage = async (messageId: string) => {
  // Implementation for deleting messages
  console.log('Delete message:', messageId)
}

const toggleReaction = async (messageId: string, emoji: string) => {
  // Implementation for toggling reactions
  console.log('Toggle reaction:', messageId, emoji)
}

const hasUserReacted = (reactions: any[], emoji: string) => {
  return reactions.some(r => r.emoji === emoji && r.userId === user.value?.id)
}

const getUniqueReactions = (reactions: any[]) => {
  const reactionMap = new Map()
  reactions.forEach(reaction => {
    const key = reaction.emoji
    if (reactionMap.has(key)) {
      reactionMap.get(key).count++
    } else {
      reactionMap.set(key, { emoji: reaction.emoji, count: 1 })
    }
  })
  return Array.from(reactionMap.values())
}

const getTypingText = () => {
  const count = typingUsers.value.length
  if (count === 1) {
    return `${typingUsers.value[0].username} is typing...`
  } else if (count === 2) {
    return `${typingUsers.value[0].username} and ${typingUsers.value[1].username} are typing...`
  } else {
    return `${count} people are typing...`
  }
}

const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Lifecycle
onMounted(() => {
  scrollToBottom()
})

// Watch for new messages and auto-scroll
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })
</script>

<style scoped>
.stream-chat-container {
  @apply flex flex-col h-full bg-gray-900 text-white;
}

.chat-header {
  @apply flex items-center justify-between p-3 border-b border-gray-700;
}

.chat-title {
  @apply flex items-center gap-2 font-semibold;
}

.chat-actions {
  @apply flex items-center gap-2;
}

.chat-action-btn {
  @apply p-2 hover:bg-gray-700 rounded-lg transition-colors;
}

.chat-messages {
  @apply flex-1 overflow-y-auto p-3 space-y-3;
  scrollbar-width: thin;
  scrollbar-color: #4B5563 #1F2937;
}

.chat-messages::-webkit-scrollbar {
  @apply w-2;
}

.chat-messages::-webkit-scrollbar-track {
  @apply bg-gray-800;
}

.chat-messages::-webkit-scrollbar-thumb {
  @apply bg-gray-600 rounded-full;
}

.chat-loading {
  @apply flex flex-col items-center justify-center py-8 text-gray-400;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2;
}

.chat-message {
  @apply relative;
}

.system-message {
  @apply flex items-center gap-2 text-sm text-gray-400 italic justify-center py-2;
}

.pewgift-message {
  @apply bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3 border-l-4 border-yellow-400;
}

.pewgift-animation {
  @apply flex items-center gap-3;
}

.gift-icon {
  @apply w-8 h-8;
}

.pewgift-info {
  @apply flex-1;
}

.pewgift-header {
  @apply flex items-center gap-2 mb-1;
}

.pewgift-content {
  @apply flex items-center justify-between;
}

.gift-text {
  @apply text-sm;
}

.gift-value {
  @apply font-bold text-yellow-300;
}

.regular-message {
  @apply group relative;
}

.message-header {
  @apply flex items-center gap-2 mb-1;
}

.user-avatar {
  @apply w-6 h-6 rounded-full;
}

.username {
  @apply font-semibold text-sm;
}

.username.streamer {
  @apply text-red-400;
}

.username.moderator {
  @apply text-green-400;
}

.username.verified {
  @apply text-blue-400;
}

.user-badges {
  @apply flex items-center gap-1;
}

.badge {
  @apply text-xs;
}

.timestamp {
  @apply text-xs text-gray-400 ml-auto;
}

.message-content {
  @apply ml-8;
}

.message-reactions {
  @apply flex items-center gap-1 mt-2;
}

.reaction-btn {
  @apply px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-xs transition-colors;
}

.reaction-btn.active {
  @apply bg-blue-600 hover:bg-blue-700;
}

.message-actions {
  @apply absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity;
}

.action-btn {
  @apply p-1 hover:bg-gray-700 rounded text-xs;
}

.action-btn.active {
  @apply text-yellow-400;
}

.action-btn.delete {
  @apply hover:bg-red-600 hover:text-white;
}

.typing-indicators {
  @apply flex items-center gap-2 text-sm text-gray-400 italic;
}

.typing-animation {
  @apply flex items-center gap-1;
}

.typing-animation span {
  @apply w-1 h-1 bg-gray-400 rounded-full animate-pulse;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

.pinned-message {
  @apply flex items-center gap-3 p-3 bg-yellow-600 bg-opacity-20 border-l-4 border-yellow-400;
}

.pinned-content {
  @apply flex-1;
}

.pinned-username {
  @apply font-semibold text-yellow-300;
}

.pinned-text {
  @apply ml-2;
}

.unpin-btn {
  @apply p-1 hover:bg-gray-700 rounded;
}

.chat-input-container {
  @apply border-t border-gray-700 p-3 space-y-3;
}

.quick-reactions {
  @apply flex items-center gap-2;
}

.reaction-quick-btn {
  @apply p-2 hover:bg-gray-700 rounded-lg text-lg transition-colors;
}

.message-input-wrapper {
  @apply flex items-center gap-2;
}

.message-input {
  @apply flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500;
}

.send-btn {
  @apply p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors;
}

.char-counter {
  @apply text-xs text-gray-400 text-right;
}

.char-counter.warning {
  @apply text-yellow-400;
}

.chat-settings-modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.settings-content {
  @apply bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4;
}

.setting-item {
  @apply mb-4;
}

.setting-item label {
  @apply flex items-center gap-2 text-sm;
}

.setting-item input,
.setting-item select {
  @apply bg-gray-700 border border-gray-600 rounded px-2 py-1;
}

.close-settings-btn {
  @apply w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors;
}

/* Message animations */
.chat-message {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
