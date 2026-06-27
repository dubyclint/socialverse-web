// composables/use-posts-feed.ts
// ============================================================================
// POST FEED COMPOSABLE - Manage posts, likes, comments, and shares
// ============================================================================

import { ref, computed } from 'vue'

export interface PostMedia {
  id: string
  url: string
  type: 'image' | 'video'
  thumbnail?: string
}

export interface PostComment {
  id: string
  user_id: string
  username: string
  avatar_url: string
  content: string
  created_at: string
  likes_count: number
  is_liked: boolean
}

export interface Post {
  id: string
  user_id: string
  content: string
  privacy: 'public' | 'friends' | 'private'
  published_at: string
  updated_at?: string
  likes_count: number
  comments_count: number
  shares_count: number
  gifts_count?: number
  is_liked: boolean
  username: string
  avatar_url: string
  media: PostMedia[]
  tags: string[]
  comments?: PostComment[]
  is_bookmarked?: boolean
  is_shared?: boolean
}

export interface FeedFilter {
  type?: 'all' | 'following' | 'trending'
  sortBy?: 'recent' | 'popular' | 'trending'
  privacy?: 'public' | 'friends' | 'private'
}

export const usePostsFeed = () => {
  // State
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const refreshing = ref(false)
  const hasMore = ref(true)
  const offset = ref(0)
  const limit = 20
  const error = ref<string | null>(null)
  const filter = ref<FeedFilter>({
    type: 'all',
    sortBy: 'recent'
  })

  // Computed
  const isEmpty = computed(() => posts.value.length === 0 && !loading.value)
  const isLoading = computed(() => loading.value || refreshing.value)
  const totalPosts = computed(() => posts.value.length)
  const totalLikes = computed(() => 
    posts.value.reduce((sum, post) => sum + post.likes_count, 0)
  )
  const totalComments = computed(() =>
    posts.value.reduce((sum, post) => sum + post.comments_count, 0)
  )

  /**
   * Load feed posts with pagination
   */
  const loadFeed = async (reset = false): Promise<boolean> => {
    if (loading.value || (!hasMore.value && !reset)) return false

    loading.value = true
    error.value = null

    try {
      const currentOffset = reset ? 0 : offset.value

      const response = await $fetch<any>('/api/posts/feed', {
        query: {
          limit,
          offset: currentOffset,
          type: filter.value.type,
          sortBy: filter.value.sortBy,
          privacy: filter.value.privacy
        }
      })

      if (response.success) {
        if (reset) {
          posts.value = response.data || []
        } else {
          posts.value.push(...(response.data || []))
        }

        offset.value = currentOffset + limit
        hasMore.value = (response.data || []).length === limit

        return true
      } else {
        error.value = response.message || 'Failed to load feed'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while loading the feed'
      console.error('Load feed error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh feed (pull to refresh)
   */
  const refreshFeed = async (): Promise<boolean> => {
    refreshing.value = true
    offset.value = 0
    hasMore.value = true
    error.value = null

    try {
      const success = await loadFeed(true)
      return success
    } finally {
      refreshing.value = false
    }
  }

  /**
   * Like or unlike a post
   */
  const likePost = async (postId: string): Promise<boolean> => {
    try {
      const post = posts.value.find(p => p.id === postId)
      if (!post) return false

      const response = await $fetch<any>(`/api/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.success) {
        post.is_liked = response.data.liked
        post.likes_count += response.data.liked ? 1 : -1
        return true
      } else {
        error.value = response.message || 'Failed to like post'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while liking the post'
      console.error('Like post error:', err)
      return false
    }
  }

  /**
   * Bookmark or unbookmark a post
   */
  const bookmarkPost = async (postId: string): Promise<boolean> => {
    try {
      const post = posts.value.find(p => p.id === postId)
      if (!post) return false

      const response = await $fetch<any>(`/api/posts/${postId}/bookmark`, {
        method: 'POST'
      })

      if (response.success) {
        post.is_bookmarked = response.data.bookmarked
        return true
      } else {
        error.value = response.message || 'Failed to bookmark post'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while bookmarking the post'
      console.error('Bookmark post error:', err)
      return false
    }
  }

  /**
   * Add comment to post
   */
  const addComment = async (
    postId: string,
    content: string,
    mediaUrl?: string
  ): Promise<PostComment | null> => {
    try {
      if (!content.trim()) {
        error.value = 'Comment cannot be empty'
        return null
      }

      const post = posts.value.find(p => p.id === postId)
      if (!post) return null

      const response = await $fetch<any>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: {
          content: content.trim(),
          media_url: mediaUrl || null
        }
      })

      if (response.success) {
        post.comments_count += 1

        // Add comment to local state if comments array exists
        if (post.comments) {
          post.comments.push(response.data)
        }

        return response.data
      } else {
        error.value = response.message || 'Failed to add comment'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while adding the comment'
      console.error('Add comment error:', err)
      return null
    }
  }

  /**
   * Delete comment from post
   */
  const deleteComment = async (postId: string, commentId: string): Promise<boolean> => {
    try {
      const post = posts.value.find(p => p.id === postId)
      if (!post) return false

      const response = await $fetch<any>(
        `/api/posts/${postId}/comments/${commentId}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        post.comments_count = Math.max(0, post.comments_count - 1)

        // Remove from local state
        if (post.comments) {
          post.comments = post.comments.filter(c => c.id !== commentId)
        }

        return true
      } else {
        error.value = response.message || 'Failed to delete comment'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while deleting the comment'
      console.error('Delete comment error:', err)
      return false
    }
  }

  /**
   * Share post to social media or copy link
   */
  const sharePost = async (
    postId: string,
    platform?: 'twitter' | 'facebook' | 'linkedin' | 'copy'
  ): Promise<boolean> => {
    try {
      const post = posts.value.find(p => p.id === postId)
      if (!post) return false

      if (platform === 'copy') {
        // Copy link to clipboard
        const postUrl = `${window.location.origin}/posts/${postId}`
        await navigator.clipboard.writeText(postUrl)
        return true
      }

      const response = await $fetch<any>(`/api/posts/${postId}/share`, {
        method: 'POST',
        body: { platform }
      })

      if (response.success) {
        post.shares_count += 1
        post.is_shared = true
        return true
      } else {
        error.value = response.message || 'Failed to share post'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while sharing the post'
      console.error('Share post error:', err)
      return false
    }
  }

  /**
   * Delete post
   */
  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const response = await $fetch<any>(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.success) {
        posts.value = posts.value.filter(p => p.id !== postId)
        return true
      } else {
        error.value = response.message || 'Failed to delete post'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while deleting the post'
      console.error('Delete post error:', err)
      return false
    }
  }

  /**
   * Update post
   */
  const updatePost = async (
    postId: string,
    content: string,
    privacy?: string
  ): Promise<Post | null> => {
    try {
      if (!content.trim()) {
        error.value = 'Post content cannot be empty'
        return null
      }

      const response = await $fetch<any>(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: {
          content: content.trim(),
          privacy: privacy || 'public'
        }
      })

      if (response.success) {
        const postIndex = posts.value.findIndex(p => p.id === postId)
        if (postIndex !== -1) {
          posts.value[postIndex] = response.data
        }
        return response.data
      } else {
        error.value = response.message || 'Failed to update post'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while updating the post'
      console.error('Update post error:', err)
      return null
    }
  }

  /**
   * Load comments for a post
   */
  const loadComments = async (postId: string, limit = 10): Promise<PostComment[]> => {
    try {
      const post = posts.value.find(p => p.id === postId)
      if (!post) return []

      const response = await $fetch<any>(`/api/posts/${postId}/comments`, {
        query: { limit }
      })

      if (response.success) {
        post.comments = response.data
        return response.data
      } else {
        error.value = response.message || 'Failed to load comments'
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while loading comments'
      console.error('Load comments error:', err)
      return []
    }
  }

  /**
   * Set feed filter
   */
  const setFilter = (newFilter: Partial<FeedFilter>): void => {
    filter.value = { ...filter.value, ...newFilter }
  }

  /**
   * Reset filter
   */
  const resetFilter = (): void => {
    filter.value = {
      type: 'all',
      sortBy: 'recent'
    }
  }

  /**
   * Clear error
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * Get post by ID
   */
  const getPostById = (postId: string): Post | undefined => {
    return posts.value.find(p => p.id === postId)
  }

  /**
   * Search posts
   */
  const searchPosts = async (query: string): Promise<Post[]> => {
    try {
      if (!query.trim()) {
        error.value = 'Search query cannot be empty'
        return []
      }

      const response = await $fetch<any>('/api/posts/search', {
        query: { q: query.trim(), limit: 50 }
      })

      if (response.success) {
        return response.data || []
      } else {
        error.value = response.message || 'Failed to search posts'
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while searching posts'
      console.error('Search posts error:', err)
      return []
    }
  }

  /**
   * Get trending posts
   */
  const getTrendingPosts = async (): Promise<Post[]> => {
    try {
      const response = await $fetch<any>('/api/posts/trending', {
        query: { limit: 50 }
      })

      if (response.success) {
        return response.data || []
      } else {
        error.value = response.message || 'Failed to load trending posts'
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while loading trending posts'
      console.error('Get trending posts error:', err)
      return []
    }
  }

  /**
   * Get posts by hashtag
   */
  const getPostsByHashtag = async (hashtag: string): Promise<Post[]> => {
    try {
      if (!hashtag.trim()) {
        error.value = 'Hashtag cannot be empty'
        return []
      }

      const response = await $fetch<any>('/api/posts/hashtag', {
        query: { tag: hashtag.trim().replace('#', ''), limit: 50 }
      })

      if (response.success) {
        return response.data || []
      } else {
        error.value = response.message || 'Failed to load posts for this hashtag'
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while loading posts'
      console.error('Get posts by hashtag error:', err)
      return []
    }
  }

  /**
   * Report post
   */
  const reportPost = async (
    postId: string,
    reason: string,
    description?: string
  ): Promise<boolean> => {
    try {
      if (!reason.trim()) {
        error.value = 'Report reason cannot be empty'
        return false
      }

      const response = await $fetch<any>(`/api/posts/${postId}/report`, {
        method: 'POST',
        body: {
          reason: reason.trim(),
          description: description?.trim() || null
        }
      })

      if (response.success) {
        return true
      } else {
        error.value = response.message || 'Failed to report post'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while reporting the post'
      console.error('Report post error:', err)
      return false
    }
  }

  return {
    // State
    posts,
    loading,
    refreshing,
    hasMore,
    error,
    filter,

    // Computed
    isEmpty,
    isLoading,
    totalPosts,
    totalLikes,
    totalComments,

    // Methods
    loadFeed,
    refreshFeed,
    likePost,
    bookmarkPost,
    addComment,
    deleteComment,
    sharePost,
    deletePost,
    updatePost,
    loadComments,
    setFilter,
    resetFilter,
    clearError,
    getPostById,
    searchPosts,
    getTrendingPosts,
    getPostsByHashtag,
    reportPost
  }
}
