// composables/usePostFeed.ts
// ============================================================================
// POST FEED COMPOSABLE
// ============================================================================

import { ref, computed } from 'vue'

export interface Post {
  id: string
  user_id: string
  content: string
  privacy: string
  published_at: string
  likes_count: number
  comments_count: number
  shares_count: number
  is_liked: boolean
  username: string
  avatar_url: string
  media: any[]
  tags: string[]
}

export const usePostFeed = () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const offset = ref(0)
  const limit = 20

  /**
   * Load feed posts
   */
  const loadFeed = async (reset = false) => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    try {
      const currentOffset = reset ? 0 : offset.value

      const response = await $fetch<any>('/api/posts/feed', {
        query: {
          limit,
          offset: currentOffset
        }
      })

      if (response.success) {
        if (reset) {
          posts.value = response.data
        } else {
          posts.value.push(...response.data)
        }

        offset.value = currentOffset + limit
        hasMore.value = response.data.length === limit
      }
    } catch (error) {
      console.error('Load feed error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Like post
   */
  const likePost = async (postId: string) => {
    try {
      const response = await $fetch<any>(`/api/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.success) {
        const post = posts.value.find(p => p.id === postId)
        if (post) {
          post.is_liked = response.data.liked
          post.likes_count += response.data.liked ? 1 : -1
        }
      }
    } catch (error) {
      console.error('Like post error:', error)
    }
  }

  /**
   * Add comment
   */
  const addComment = async (postId: string, content: string) => {
    try {
      const response = await $fetch<any>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: { content }
      })

      if (response.success) {
        const post = posts.value.find(p => p.id === postId)
        if (post) {
          post.comments_count += 1
        }
        return response.data
      }
    } catch (error) {
      console.error('Add comment error:', error)
    }
  }

  /**
   * Share post
   */
  const sharePost = async (postId: string, platform: string) => {
    try {
      const response = await $fetch<any>(`/api/posts/${postId}/share`, {
        method: 'POST',
        body: { platform }
      })

      if (response.success) {
        const post = posts.value.find(p => p.id === postId)
        if (post) {
          post.shares_count += 1
        }
        return response.data
      }
    } catch (error) {
      console.error('Share post error:', error)
    }
  }

  /**
   * Refresh feed
   */
  const refreshFeed = async () => {
    offset.value = 0
    hasMore.value = true
    await loadFeed(true)
  }

  return {
    posts,
    loading,
    hasMore,
    loadFeed,
    likePost,
    addComment,
    sharePost,
    refreshFeed
  }
        }
  
