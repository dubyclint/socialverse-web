import { ref, computed } from 'vue'

interface UniverseMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  timestamp: string
  likes: number
  replies: number
  liked: boolean
}

export const useUniverseMessage = () => {
  const messages = ref<UniverseMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUserId = ref<string | null>(null)

  // Fetch universe messages
  const fetchMessages = async (limit: number = 50, offset: number = 0) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/universe/messages', {
        query: { limit, offset }
      })

      messages.value = data.messages || []
      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch messages'
      console.error('Fetch messages error:', err)
    } finally {
      loading.value = false
    }
  }

  // Post universe message
  const postMessage = async (content: string) => {
    if (!content.trim()) {
      error.value = 'Message cannot be empty'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/universe/messages', {
        method: 'POST',
        body: { content }
      })

      messages.value.unshift(data.message)
      return data.message
    } catch (err: any) {
      error.value = err.message || 'Failed to post message'
      console.error('Post message error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Like message
  const likeMessage = async (messageId: string) => {
    try {
      const { data } = await $fetch(`/api/universe/messages/${messageId}/like`, {
        method: 'POST'
      })

      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.likes = data.likes
        message.liked = data.liked
      }

      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to like message'
      console.error('Like message error:', err)
      throw err
    }
  }

  // Delete message
  const deleteMessage = async (messageId: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/universe/messages/${messageId}`, {
        method: 'DELETE'
      })

      messages.value = messages.value.filter(m => m.id !== messageId)
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to delete message'
      console.error('Delete message error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reply to message
  const replyToMessage = async (messageId: string, content: string) => {
    if (!content.trim()) {
      error.value = 'Reply cannot be empty'
      return null
    }

    try {
      const { data } = await $fetch(`/api/universe/messages/${messageId}/reply`, {
        method: 'POST',
        body: { content }
      })

      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.replies = data.replies
      }

      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to reply'
      console.error('Reply error:', err)
      throw err
    }
  }

  // Computed
  const messageCount = computed(() => messages.value.length)

  return {
    messages,
    loading,
    error,
    currentUserId,
    fetchMessages,
    postMessage,
    likeMessage,
    deleteMessage,
    replyToMessage,
    messageCount
  }
}
