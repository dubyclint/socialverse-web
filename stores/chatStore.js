// stores/chatStore.js (Enhanced with file management)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import fileUploadService from '@/services/fileUploadService'

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
  const uploads = ref([])
  const mediaGallery = ref([])

  // Getters
  const selectedChat = computed(() => 
    chats.value.find(chat => chat.id === selectedChatId.value)
  )

  const unreadChatsCount = computed(() => 
    chats.value.filter(chat => chat.unreadCount > 0).length
  )

  const activeUploads = computed(() =>
    uploads.value.filter(upload => upload.status === 'uploading')
  )

  const completedUploads = computed(() =>
    uploads.value.filter(upload => upload.status === 'completed')
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
        messages.value.push(data.message)
      }
    } catch (error) {
      console.error('Send message error:', error)
    }
  }

  const uploadFiles = async (files, chatId) => {
    const uploadPromises = files.map(async (file) => {
      const uploadId = Date.now() + Math.random()
      
      // Add upload to tracking
      const upload = {
        id: uploadId,
        file,
        status: 'uploading',
        progress: 0,
        chatId
      }
      uploads.value.push(upload)

      try {
        // Upload file
        const result = await fileUploadService.uploadFile(file, {
          type: getFileType(file.type),
          chatId,
          onProgress: (progress) => {
            const uploadIndex = uploads.value.findIndex(u => u.id === uploadId)
            if (uploadIndex > -1) {
              uploads.value[uploadIndex].progress = progress
            }
          }
        })

        // Update upload status
        const uploadIndex = uploads.value.findIndex(u => u.id === uploadId)
        if (uploadIndex > -1) {
          uploads.value[uploadIndex].status = 'completed'
          uploads.value[uploadIndex].result = result
        }

        // Send message with file
        await sendMessage({
          chatId,
          content: '',
          messageType: getFileType(file.type),
          mediaUrl: result.url,
          mediaMetadata: {
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            ...result.metadata
          }
        })

        return result

      } catch (error) {
        // Update upload status to error
        const uploadIndex = uploads.value.findIndex(u => u.id === uploadId)
        if (uploadIndex > -1) {
          uploads.value[uploadIndex].status = 'error'
          uploads.value[uploadIndex].error = error.message
        }
        throw error
      }
    })

    return Promise.allSettled(uploadPromises)
  }

  const cancelUpload = (uploadId) => {
    const uploadIndex = uploads.value.findIndex(u => u.id === uploadId)
    if (uploadIndex > -1) {
      uploads.value[uploadIndex].status = 'cancelled'
      // Cancel actual upload if possible
    }
  }

  const cancelAllUploads = () => {
    uploads.value.forEach(upload => {
      if (upload.status === 'uploading') {
        upload.status = 'cancelled'
      }
    })
  }

  const clearCompletedUploads = () => {
    uploads.value = uploads.value.filter(upload => 
      upload.status === 'uploading'
    )
  }

  const loadMediaGallery = async (chatId) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/media`)
      const data = await response.json()
      mediaGallery.value = data.media
    } catch (error) {
      console.error('Load media gallery error:', error)
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

    // Add to media gallery if it's a media message
    if (['image', 'video', 'audio', 'file'].includes(message.messageType)) {
      mediaGallery.value.unshift(message)
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

  // Helper function
  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'file'
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
    uploads,
    mediaGallery,
    
    // Getters
    selectedChat,
    unreadChatsCount,
    activeUploads,
    completedUploads,
    
    // Actions
    loadChats,
    selectChat,
    clearSelectedChat,
    loadMessages,
    sendMessage,
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    clearCompletedUploads,
    loadMediaGallery,
    addMessage,
    updateMessage,
    createGroup,
    createStatus
  }
})
