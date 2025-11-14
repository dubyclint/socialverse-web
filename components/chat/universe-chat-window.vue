<!-- components/chat/universe-chat-window.vue -->
<!-- ============================================================================
     UNIVERSE CHAT WINDOW - Message display and interaction
     ============================================================================ -->

<template>
  <div class="universe-chat-window">
    <!-- Error State -->
    <div v-if="error" class="error-banner">
      <span>{{ error }}</span>
      <button @click="$emit('close-error')" class="btn-close">✕</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && messages.length === 0" class="loading-state">
      <div class="spinner">⏳</div>
      <p>Loading messages...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="messages.length === 0" class="empty-state">
      <span class="empty-icon">💬</span>
      <p>No messages yet. Be the first to say hello!</p>
    </div>

    <!-- Messages List -->
    <div v-else class="messages-container">
      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-section">
        <button @click="$emit('load-more')" class="load-more-btn">
          📥 Load Earlier Messages
        </button>
      </div>

      <!-- Messages -->
      <div v-for="message in messages" :key="message.id" class="message-wrapper">
        <div class="message-bubble" :class="{ 'own-message': isOwnMessage(message) }">
          <!-- Message Header -->
          <div class="message-header">
            <div class="user-info">
              <img 
                :src="message.user?.avatar || '/default-avatar.png'"
                :alt="message.user?.name"
                class="user-avatar"
              />
              <div class="user-details">
                <span class="user-name">{{ message.user?.name }}</span>
                <span class="user-location" v-if="message.user?.location">
                  📍 {{ message.user.location }}
                </span>
              </div>
            </div>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>

          <!-- Message Content -->
          <div class="message-content">
            <p v-if="message.content" class="text">{{ message.content }}</p>
            <img 
              v-if="message.fileUrl && message.fileType?.startsWith('image')"
              :src="message.fileUrl"
              :alt="message.fileName"
              class="message-image"
            />
            <video 
              v-else-if="message.fileUrl && message.fileType?.startsWith('video')"
              :src="message.fileUrl"
              class="message-video"
              controls
            ></video>
          </div>

          <!-- Message Actions -->
          <div class="message-actions">
            <button 
              @click="$emit('like-message', message.id)"
              class="action-btn"
              :class="{ active: message.liked }"
              title="Like message"
            >
              {{ message.liked ? '❤️' : '🤍' }} {{ message.likes || 0 }}
            </button>
            <button 
              @click="toggleReactions(message.id)"
              class="action-btn"
              title="Add reaction"
            >
              😊 React
            </button>
            <button 
              @click="$emit('send-gift', message.user?.id, message.id)"
              class="action-btn"
              title="Send gift"
            >
              🎁 Gift
            </button>
            <button 
              @click="toggleTranslate(message.id)"
              class="action-btn"
              title="Translate"
            >
              🌐 Translate
            </button>
          </div>

          <!-- Reactions -->
          <div v-if="message.reactions && message.reactions.length > 0" class="reactions">
            <span 
              v-for="(reaction, idx) in message.reactions" 
              :key="idx"
              class="reaction"
            >
              {{ reaction }}
            </span>
          </div>

          <!-- Emoji Picker for Reactions -->
          <div v-if="activeReactionMessage === message.id" class="emoji-picker-inline">
            <span 
              v-for="emoji in reactionEmojis"
              :key="emoji"
              @click="addReactionToMessage(message.id, emoji)"
              class="emoji-option"
            >
              {{ emoji }}
            </span>
          </div>

          <!-- Translate Section -->
          <div v-if="activeTranslateMessage === message.id" class="translate-section">
            <select v-model="translateLang" class="lang-select">
              <option value="es">🇪🇸 Spanish</option>
              <option value="fr">🇫🇷 French</option>
              <option value="de">🇩🇪 German</option>
              <option value="it">🇮🇹 Italian</option>
              <option value="pt">🇵🇹 Portuguese</option>
              <option value="ja">🇯🇵 Japanese</option>
              <option value="zh">🇨🇳 Chinese</option>
              <option value="ko">🇰🇷 Korean</option>
            </select>
            <button 
              @click="translateMessage(message.id, message.content)"
              class="translate-btn"
            >
              Translate
            </button>
          </div>
        </div>
      </div>

      <!-- Loading More -->
      <div v-if="loading && messages.length > 0" class="loading-more">
        <span class="spinner-small">⏳</span>
        <p>Loading more messages...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Message {
  id: string
  user?: {
    id: string
    name: string
    avatar?: string
    location?: string
  }
  content: string
  timestamp: string
  likes?: number
  liked?: boolean
  reactions?: string[]
  fileUrl?: string
  fileType?: string
  fileName?: string
}

interface Props {
  messages: Message[]
  onlineCount: number
  matchedUsers?: any[]
  loading?: boolean
  error?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'send-message': [content: string]
  'like-message': [messageId: string]
  'add-reaction': [messageId: string, emoji: string]
  'translate-message': [messageId: string, text: string, lang: string]
  'send-gift': [userId: string, messageId: string]
  'load-more': []
  'close-error': []
}>()

// State
const activeReactionMessage = ref<string | null>(null)
const activeTranslateMessage = ref<string | null>(null)
const translateLang = ref('es')
const hasMore = ref(true)

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏']

// Methods
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

const isOwnMessage = (message: Message): boolean => {
  // Implement logic to check if message is from current user
  return false
}

const toggleReactions = (messageId: string): void => {
  activeReactionMessage.value = activeReactionMessage.value === messageId ? null : messageId
}

const addReactionToMessage = (messageId: string, emoji: string): void => {
  emit('add-reaction', messageId, emoji)
  activeReactionMessage.value = null
}

const toggleTranslate = (messageId: string): void => {
  activeTranslateMessage.value = activeTranslateMessage.value === messageId ? null : messageId
}

const translateMessage = (messageId: string, text: string): void => {
  emit('translate-message', messageId, text, translateLang.value)
  activeTranslateMessage.value = null
}
</script>

<style scoped>
.universe-chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f9f9f9;
}

/* Error Banner */
.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fee;
  color: #c33;
  border-bottom: 1px solid #fcc;
  font-size: 14px;
}

.btn-close {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.spinner {
  font-size: 48px;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.load-more-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.load-more-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s;
}

.load-more-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

/* Message Wrapper */
.message-wrapper {
  display: flex;
  justify-content: flex-start;
}

.message-wrapper.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.message-bubble:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-bubble.own-message {
  background: #667eea;
  color: white;
}

/* Message Header */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
}

.message-bubble.own-message .user-name {
  color: white;
}

.user-location {
  font-size: 11px;
  color: #999;
}

.message-bubble.own-message .user-location {
  color: rgba(255, 255, 255, 0.8);
}

.message-time {
  font-size: 11px;
  color: #999;
}

.message-bubble.own-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

/* Message Content */
.message-content {
  margin-bottom: 8px;
}

.text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-image,
.message-video {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

/* Message Actions */
.message-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.action-btn {
  padding: 4px 8px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.message-bubble.own-message .action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.action-btn:hover {
  background: #e0e0e0;
}

.action-btn.active {
  background: #667eea;
  color: white;
}

/* Reactions */
.reactions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.reaction {
  font-size: 16px;
  padding: 2px 4px;
  background: #f0f0f0;
  border-radius: 4px;
}

/* Emoji Picker Inline */
.emoji-picker-inline {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 8px;
  background: #f0f0f0;
  border-radius: 6px;
  margin-top: 8px;
}

.emoji-option {
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  text-align: center;
}

.emoji-option:hover {
  background: white;
  transform: scale(1.2);
}

/* Translate Section */
.translate-section {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.lang-select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 12px;
}

.translate-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s;
}

.translate-btn:hover {
  background: #764ba2;
}

/* Loading More */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 1rem;
  color: #999;
  font-size: 14px;
}

.spinner-small {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 640px) {
  .message-bubble {
    max-width: 90%;
  }

  .emoji-picker-inline {
    grid-template-columns: repeat(6, 1fr);
  }

  .message-actions {
    gap: 4px;
  }

  .action-btn {
    padding: 3px 6px;
    font-size: 11px;
  }
}
</style>
