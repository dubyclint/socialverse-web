// stores/chatStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref([])
  const selectedChatId = ref(null)
  const messages = ref([])
  const contacts = ref([])
  const pals = ref([])
  const onlinePals = ref([])
  const statusUsers = ref([])
  const typingUsers = ref({})

  // Getters
  const selectedChat = computed(() => 
    chats.value.find(chat => chat.id === selectedChatId.value)
  )

  const unreadChatsCount = computed(() => 
    chats.value.filter(chat => chat.unreadCount > 0).length
  )

  // Actions
  const loadChats = async () => {
    try {
      const response = await fetch('/api/chat')
      const data = await response.json()
      chats.value = data.chats
    } catch (error) {
      console.error('Load chats error:', error)
    }
  }

  const selectChat = (chatId) => {
    selectedChatId.value = chatId
  }

  const clearSelectedChat = () => {
    selectedChatId.value = null
    messages.value = []
  }

  const loadMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`)
      const data = await response.json()
      messages.value = data.messages
    } catch (error) {
      console.error('Load messages error:', error)
    }
  }

  const sendMessage = async (messageData) => {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })
      const data = await response.json()
      
      if (data.success) {
        // Optimistic update
        messages.value.push(data.message)
      }
    } catch (error) {
      console.error('Send message error:', error)
    }
  }

  const addMessage = (message) => {
    messages.value.push(message)
    
    // Update chat's last message
    const chat = chats.value.find(c => c.id === message.chatId)
    if (chat) {
      chat.lastMessage = message
      chat.lastMessageAt = message.createdAt
    }
  }

  const updateMessage = (messageId, updates) => {
    const messageIndex = messages.value.findIndex(m => m.id === messageId)
    if (messageIndex > -1) {
      messages.value[messageIndex] = { ...messages.value[messageIndex], ...updates }
    }
  }

  const createGroup = async (groupData) => {
    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        body: groupData instanceof FormData ? groupData : JSON.stringify(groupData),
        headers: groupData instanceof FormData ? {} : { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.success) {
        chats.value.unshift(data.group)
        return data.group
      }
    } catch (error) {
      console.error('Create group error:', error)
      throw error
    }
  }

  const createStatus = async (statusData) => {
    try {
      const response = await fetch('/api/status/create', {
        method: 'POST',
        body: statusData instanceof FormData ? statusData : JSON.stringify(statusData),
        headers: statusData instanceof FormData ? {} : { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.success) {
        return data.status
      }
    } catch (error) {
      console.error('Create status error:', error)
      throw error
    }
  }

  return {
    // State
    chats,
    selectedChatId,
    messages,
    contacts,
    pals,
    onlinePals,
    statusUsers,
    typingUsers,
    
    // Getters
    selectedChat,
    unreadChatsCount,
    
    // Actions
    loadChats,
    selectChat,
    clearSelectedChat,
    loadMessages,
    sendMessage,
    addMessage,
    updateMessage,
    createGroup,
    createStatus
  }
})
