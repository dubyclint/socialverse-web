<!-- components/universe-chat.vue -->
<!-- ============================================================================
     UNIVERSE CHAT - Global chat interface with filtering and real-time messaging
     ============================================================================ -->

<template>
  <div class="universe-chat-container">
    <!-- Header -->
    <universe-chat-header 
      :online-count="onlineCount"
      :unread-count="unreadCount"
      @search="handleSearch"
      @filter-change="handleFilterChange"
    />

    <!-- Chat Window -->
    <universe-chat-window 
      :messages="windowMessages"
      :online-count="onlineCount"
      :current-user-id="currentUserId"
      :has-more="hasMore"
      :loading="loading"
      :error="error"
      @load-more="loadMoreMessages"
      @close-error="error = null"
    />

    <!-- Message Input -->
    <div class="message-input-section">
      <div class="input-wrapper">
        <textarea 
          v-model="messageContent"
          @keydown.enter.ctrl="sendMessage"
          placeholder="Type a message... (Ctrl+Enter to send)"
          class="message-input"
          rows="3"
        ></textarea>
        <div class="input-actions">
          <button 
            @click="attachFile"
            class="action-btn"
            title="Attach file"
          >
            📎
          </button>
          <button 
            @click="showEmojiPicker = !showEmojiPicker"
            class="action-btn"
            title="Add emoji"
          >
            😊
          </button>
          <button 
            @click="sendMessage"
            class="send-btn"
            :disabled="!messageContent.trim() || sending"
          >
            {{ sending ? '⏳' : '📤' }} Send
          </button>
        </div>
      </div>
      <div v-if="showEmojiPicker" class="emoji-picker">
        <span 
          v-for="emoji in commonEmojis" 
          :key="emoji"
          @click="insertEmoji(emoji)"
          class="emoji"
        >
          {{ emoji }}
        </span>
      </div>
    </div>

    <!-- File Input (Hidden) -->
    <input 
      ref="fileInput"
      type="file"
      @change="handleFileUpload"
      class="hidden-input"
      accept="image/*,video/*"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSocket } from '~/composables/use-socket'
import UniverseChatHeader from '@/components/chat/universe-chat-header.vue'
import UniverseChatWindow from '@/components/chat/universe-chat-window.vue'

interface UniverseRow {
  id: string
  user_id: string
  content: string
  created_at: string
  username?: string
  avatar?: string
  fileUrl?: string
  fileType?: string
  fileName?: string
}

interface UniverseResponse {
  success: boolean
  data: UniverseRow[]
  hasMore: boolean
}

const { socket } = useSocket()
const supabaseUser = useSupabaseUser()

const messages = ref<UniverseRow[]>([])
const searchQuery = ref('')
const hasMore = ref(false)
const messageContent = ref('')
const sending = ref(false)
const loading = ref(false)
const onlineCount = ref(0)
const unreadCount = ref(0)
const error = ref<string | null>(null)
const showEmojiPicker = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const filters = ref({
  country: '',
  interest: '',
  language: 'en'
})

const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤗']

const currentUserId = computed(() => supabaseUser.value?.id)

const windowMessages = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return messages.value
    .filter(m => !q || m.content.toLowerCase().includes(q))
    .map(m => ({
      id: m.id,
      user: { id: m.user_id, name: m.username || 'unknown', avatar: m.avatar },
      content: m.content,
      timestamp: m.created_at,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileName: m.fileName
    }))
})

const fetchMessages = async (offset = 0): Promise<void> => {
  loading.value = true
  try {
    const response = await $fetch<UniverseResponse>('/api/universe/messages', {
      query: {
        offset,
        limit: 50,
        country: filters.value.country || undefined,
        interest: filters.value.interest || undefined,
        language: filters.value.language || undefined
      }
    })
    messages.value = offset === 0 ? response.data : [...response.data, ...messages.value]
    hasMore.value = response.hasMore
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to load messages'
  } finally {
    loading.value = false
  }
}

const handleSearch = (query: string): void => {
  searchQuery.value = query
}

const handleFilterChange = async (newFilters: Partial<typeof filters.value>): Promise<void> => {
  filters.value = { ...filters.value, ...newFilters }
  await fetchMessages(0)
}

const sendMessage = async (): Promise<void> => {
  const content = messageContent.value.trim()
  if (!content || sending.value) return

  sending.value = true
  error.value = null

  // The server broadcasts the persisted row back to this socket too, so the
  // message is only rendered once it exists in the database.
  socket?.emit(
    'universe:send-message',
    { content, ...filters.value },
    (result: { success: boolean; error?: string }) => {
      sending.value = false
      if (result?.success) messageContent.value = ''
      else error.value = result?.error || 'Failed to send message'
    }
  )

  if (!socket) {
    try {
      await $fetch('/api/universe/send', { method: 'POST', body: { content, ...filters.value } })
      messageContent.value = ''
      await fetchMessages(0)
    } catch (err: any) {
      error.value = err?.data?.statusMessage || 'Failed to send message'
    } finally {
      sending.value = false
    }
  }
}

const loadMoreMessages = async (): Promise<void> => {
  await fetchMessages(messages.value.length)
}

const attachFile = (): void => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    // Upload file and send as message
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await $fetch<{ success: boolean; data: { url: string } }>('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      socket?.emit('universe:send-message', {
        content: response.data.url,
        ...filters.value
      })
    }
  } catch (err) {
    console.error('File upload error:', err)
  }
}

const insertEmoji = (emoji: string): void => {
  messageContent.value += emoji
}

// Lifecycle
onMounted(async () => {
  await fetchMessages(0)

  socket?.emit('universe:join', filters.value)

  socket?.on('universe:message', (message: UniverseRow) => {
    if (messages.value.some(m => m.id === message.id)) return
    messages.value = [...messages.value, message]
  })

  socket?.on('universe:online-count', (data: { count: number }) => {
    onlineCount.value = data.count
  })

  socket?.on('universe:error', (data: { message: string }) => {
    error.value = data.message
  })
})

onUnmounted(() => {
  socket?.off('universe:message')
  socket?.off('universe:online-count')
  socket?.off('universe:error')
  socket?.emit('universe:leave', {})
})
</script>

<style scoped>
.universe-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Message Input Section */
.message-input-section {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  transition: all 0.3s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #667eea;
}

.send-btn {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Emoji Picker */
.emoji-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
  gap: 8px;
  padding: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.emoji {
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji:hover {
  background: #f0f0f0;
  transform: scale(1.2);
}

.hidden-input {
  display: none;
}

/* Responsive */
@media (max-width: 640px) {
  .message-input-section {
    padding: 0.75rem;
  }

  .message-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  .emoji-picker {
    grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
  }
}
</style>
