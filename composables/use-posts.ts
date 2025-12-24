// FILE: /composables/use-posts.ts - COMPLETE FIXED VERSION
// ============================================================================
// POSTS COMPOSABLE - FIXED: Post management and retrieval
// ✅ FIXED: Create post
// ✅ FIXED: Get user posts
// ✅ FIXED: Get feed posts
// ✅ FIXED: Update post
// ✅ FIXED: Delete post
// ============================================================================

import { ref } from 'vue'

export const usePosts = () => {
  const loading = ref(false)
  const error = ref('')

  /**
   * Create post
   */
  const createPost = async (postData: any) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[usePosts] Creating post...')

      const result = await $fetch('/api/posts/create', {
        method: 'POST',
        body: postData
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to create post')
      }

      console.log('[usePosts] ✅ Post created successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to create post'
      error.value = errorMsg
      console.error('[usePosts] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get user posts
   */
  const getUserPosts = async (userId: string, page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[usePosts] Fetching user posts...', { userId, page, limit })

      const result = await $fetch(`/api/posts/user/${userId}`, {
        query: { page, limit }
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to fetch posts')
      }

      console.log('[usePosts] ✅ Posts fetched successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to fetch posts'
      error.value = errorMsg
      console.error('[usePosts] ❌ Error:', errorMsg)
      return { posts: [], total: 0, page, limit, hasMore: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * Get feed posts
   */
  const getFeedPosts = async (page: number = 1, limit: number = 12) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[usePosts] Fetching feed posts...', { page, limit })

      const result = await $fetch('/api/posts/feed', {
        query: { page, limit }
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to fetch feed')
      }

      console.log('[usePosts] ✅ Feed posts fetched successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to fetch feed'
      error.value = errorMsg
      console.error('[usePosts] ❌ Error:', errorMsg)
      return { posts: [], total: 0, page, limit, hasMore: false }
    } finally {
      loading.value = false
    }
  }

  /**
   * Update post
   */
  const updatePost = async (postId: string, updates: any) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[usePosts] Updating post...', { postId })

      const result = await $fetch(`/api/posts/${postId}/update`, {
        method: 'POST',
        body: updates
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update post')
      }

      console.log('[usePosts] ✅ Post updated successfully')
      return result.data
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to update post'
      error.value = errorMsg
      console.error('[usePosts] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete post
   */
  const deletePost = async (postId: string) => {
    loading.value = true
    error.value = ''

    try {
      console.log('[usePosts] Deleting post...', { postId })

      const result = await $fetch(`/api/posts/${postId}/delete`, {
        method: 'POST'
      })

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to delete post')
      }

      console.log('[usePosts] ✅ Post deleted successfully')
      return result
    } catch (err: any) {
      const errorMsg = err.data?.statusMessage || err.message || 'Failed to delete post'
      error.value = errorMsg
      console.error('[usePosts] ❌ Error:', errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = ''
  }

  return {
    loading,
    error,
    createPost,
    getUserPosts,
    getFeedPosts,
    updatePost,
    deletePost,
    clearError
  }
}
