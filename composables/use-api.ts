// FILE: /composables/use-api.ts (COMPLETE FIXED VERSION)
// ============================================================================
// API COMPOSABLE - FIXED: Proper error handling and $fetch usage
// ============================================================================
// ✅ CRITICAL FIX: All error handlers return instead of throw
// ✅ All API calls properly use $fetch
// ✅ User ID extraction and passing works correctly
// ✅ Comprehensive error handling with detailed logging
// ✅ Graceful fallbacks for all endpoints
// ✅ FIXED: Removed extra closing brace in return statement
// ============================================================================

import type { FetchOptions } from 'ofetch'

export const useApi = () => {
  const { $fetch } = useNuxtApp()
  const authStore = useAuthStore()

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * ✅ CRITICAL: Get user ID from auth store
   * Throws error if user is not authenticated
   */
  const getUserId = (): string => {
    const userId = authStore.user?.id || authStore.userId
    
    if (!userId) {
      console.error('[API] ❌ User not authenticated - no user ID available')
      throw new Error('User not authenticated')
    }
    
    console.log('[API] ✅ Using user ID:', userId)
    return userId
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================
  const profile = {
    /**
     * Get current user's profile
     */
    async getMe() {
      try {
        console.log('[API] Fetching current user profile...')
        const response = await $fetch('/api/profile/me')
        console.log('[API] ✅ Profile fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching profile:', error)
        return null
      }
    },

    /**
     * ✅ CRITICAL FIX: Get profile by user ID
     * Now properly passes user ID to backend
     */
    async getProfile(userId?: string) {
      try {
        const id = userId || getUserId()
        console.log('[API] Fetching profile for user:', id)
        
        const response = await $fetch(`/api/profile/${id}`)
        console.log('[API] ✅ Profile fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching profile:', error)
        return null
      }
    },

    /**
     * Update current user's profile
     */
    async updateProfile(updates: any) {
      try {
        const userId = getUserId()
        console.log('[API] Updating profile for user:', userId)
        
        const response = await $fetch('/api/profile/update', {
          method: 'POST',
          body: {
            user_id: userId,
            ...updates
          }
        })
        console.log('[API] ✅ Profile updated successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error updating profile:', error)
        return null
      }
    },

    /**
     * Complete user profile
     */
    async completeProfile(profileData: any) {
      try {
        const userId = getUserId()
        console.log('[API] Completing profile for user:', userId)
        
        const response = await $fetch('/api/profile/complete', {
          method: 'POST',
          body: {
            user_id: userId,
            ...profileData
          }
        })
        console.log('[API] ✅ Profile completed successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error completing profile:', error)
        return null
      }
    },

    /**
     * Upload avatar
     */
    async uploadAvatar(file: File) {
      try {
        const userId = getUserId()
        console.log('[API] Uploading avatar for user:', userId)
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('user_id', userId)
        
        const response = await $fetch('/api/profile/avatar-upload', {
          method: 'POST',
          body: formData
        })
        console.log('[API] ✅ Avatar uploaded successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error uploading avatar:', error)
        return null
      }
    }
  }

  // ============================================================================
  // POSTS OPERATIONS
  // ============================================================================
  const posts = {
    /**
     * ✅ CRITICAL FIX: Get posts by user ID
     * Now properly passes user ID to backend
     */
    async getUserPosts(userId?: string, page: number = 1, limit: number = 12) {
      try {
        const id = userId || getUserId()
        console.log('[API] Fetching posts for user:', id, `page: ${page}, limit: ${limit}`)
        
        const response = await $fetch(`/api/posts/user/${id}`, {
          query: { page, limit }
        })
        console.log('[API] ✅ Posts fetched successfully:', response.posts?.length || 0, 'items')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching posts:', error)
        return { posts: [], total: 0, page, limit, has_more: false }
      }
    },

    /**
     * Get all posts (feed)
     */
    async getAll(page: number = 1, limit: number = 12) {
      try {
        console.log('[API] Fetching posts feed...')
        const response = await $fetch('/api/posts', {
          query: { page, limit }
        })
        console.log('[API] ✅ Feed fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching feed:', error)
        return { posts: [], total: 0, page, limit, has_more: false }
      }
    },

    /**
     * Create a new post
     */
    async create(content: string, mediaFiles?: any[]) {
      try {
        const userId = getUserId()
        console.log('[API] Creating post for user:', userId)
        
        const response = await $fetch('/api/posts', {
          method: 'POST',
          body: {
            user_id: userId,
            content,
            media_files: mediaFiles
          }
        })
        console.log('[API] ✅ Post created successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error creating post:', error)
        return null
      }
    },

    /**
     * Get single post
     */
    async getPost(postId: string) {
      try {
        console.log('[API] Fetching post:', postId)
        const response = await $fetch(`/api/posts/${postId}`)
        console.log('[API] ✅ Post fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching post:', error)
        return null
      }
    },

    /**
     * Delete post
     */
    async deletePost(postId: string) {
      try {
        const userId = getUserId()
        console.log('[API] Deleting post:', postId)
        
        const response = await $fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
          body: { user_id: userId }
        })
        console.log('[API] ✅ Post deleted successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error deleting post:', error)
        return null
      }
    }
  }

  // ============================================================================
  // NOTIFICATIONS OPERATIONS
  // ============================================================================
  const notifications = {
    async getAll(page: number = 1, limit: number = 20) {
      try {
        const userId = getUserId()
        console.log('[API] Fetching notifications for user:', userId)
        
        const response = await $fetch('/api/notifications', {
          query: { user_id: userId, page, limit }
        })
        console.log('[API] ✅ Notifications fetched')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching notifications:', error)
        return { notifications: [], total: 0, page, limit }
      }
    },

    async markAsRead(notificationId: string) {
      try {
        const userId = getUserId()
        console.log('[API] Marking notification as read:', notificationId)
        
        const response = await $fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
          body: { user_id: userId }
        })
        console.log('[API] ✅ Notification marked as read')
        return response
      } catch (error) {
        console.error('[API] ❌ Error marking notification as read:', error)
        return null
      }
    }
  }

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================
  const admin = {
    async getStats() {
      try {
        console.log('[API] Fetching admin stats...')
        const response = await $fetch('/api/admin/stats')
        console.log('[API] ✅ Admin stats fetched')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching admin stats:', error)
        return null
      }
    }
  }

  // ============================================================================
  // STREAM OPERATIONS
  // ============================================================================
  const stream = {
    async getStreams(page: number = 1, limit: number = 12) {
      try {
        console.log('[API] Fetching streams...')
        const response = await $fetch('/api/stream', {
          query: { page, limit }
        })
        console.log('[API] ✅ Streams fetched')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching streams:', error)
        return { streams: [], total: 0, page, limit }
      }
    }
  }

  // ============================================================================
  // WALLET OPERATIONS
  // ============================================================================
  const wallet = {
    async getBalance() {
      try {
        const userId = getUserId()
        console.log('[API] Fetching wallet balance for user:', userId)
        
        const response = await $fetch('/api/wallet', {
          query: { user_id: userId }
        })
        console.log('[API] ✅ Wallet balance fetched')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching wallet balance:', error)
        return null
      }
    },

    async getTransactions(page: number = 1, limit: number = 20) {
      try {
        const userId = getUserId()
        console.log('[API] Fetching wallet transactions for user:', userId)
        
        const response = await $fetch('/api/wallet/transactions', {
          query: { user_id: userId, page, limit }
        })
        console.log('[API] ✅ Wallet transactions fetched')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching wallet transactions:', error)
        return { transactions: [], total: 0, page, limit }
      }
    }
  }

  // ============================================================================
  // RETURN ALL OPERATIONS
  // ============================================================================
  return {
    profile,
    posts,
    notifications,
    admin,
    stream,
    wallet,
    // Helper function for manual user ID retrieval
    getUserId
  }
}
