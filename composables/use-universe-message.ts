import { ref, computed } from 'vue'

interface UniverseMessage {
  id: string
  user_id: string
  username: string
  avatar?: string
  content: string
  created_at: string
  likes: number
  replies: number
  liked: boolean
  country?: string
  interest?: string
  language?: string
}

export const useUniverseMessage = () => {
  const messages = ref<UniverseMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUserId = ref<string | null>(null)

  // Fetch universe messages with filters
  const fetchMessages = async (filters: {
    country?: string
    interest?: string
    language?: string
    limit?: number
    offset?: number
  } = {}) => {
    loading.value = true
    error.value = null

    try {
      const { country, interest, language = 'en', limit = 50, offset = 0 } = filters
      
      const query: any = { limit, offset, language }
      if (country) query.country = country
      if (interest) query.interest = interest

      const { data } = await $fetch('/api/universe/messages', {
        query
      })

      messages.value = data || []
      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch messages'
      console.error('Fetch messages error:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Post universe message
  const postMessage = async (content: string, metadata?: {
    country?: string
    interest?: string
    language?: string
  }) => {
    if (!content.trim()) {
      error.value = 'Message cannot be empty'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch('/api/universe/send', {
        method: 'POST',
        body: {
          content: content.trim(),
          country: metadata?.country,
          interest: metadata?.interest,
          language: metadata?.language || 'en'
        }
      })

      // Fetch updated messages
      await fetchMessages()
      return data
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

  // Add reaction/emoji
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const { data } = await $fetch(`/api/universe/messages/${messageId}/reaction`, {
        method: 'POST',
        body: { emoji }
      })

      return data
    } catch (err: any) {
      error.value = err.message || 'Failed to add reaction'
      console.error('Add reaction error:', err)
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
    addReaction,
    messageCount
  }
}
