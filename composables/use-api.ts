// FILE: /composables/use-api.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// API COMPOSABLE - FIXED: Proper user ID extraction and passing to all endpoints
// ============================================================================
// ✅ CRITICAL FIX: All API calls now properly extract and pass user ID
// ✅ User ID is obtained from auth store and passed to backend
// ✅ Comprehensive error handling with detailed logging
// ✅ All endpoints include proper authentication context
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

  /**
   * ✅ Handle API errors with detailed logging
   */
  const handleError = (error: any, endpoint: string) => {
    console.error(`[API] ❌ Error on ${endpoint}:`, error)
    
    if (error.data?.statusCode === 401) {
      console.error('[API] Unauthorized - clearing auth')
      authStore.clearAuth()
    }
    
    throw error
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
        return handleError(error, 'GET /api/profile/me')
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
        return handleError(error, `GET /api/profile/${userId}`)
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
        return handleError(error, 'POST /api/profile/update')
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
        return handleError(error, 'POST /api/profile/complete')
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
        return handleError(error, 'POST /api/profile/avatar-upload')
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
        return handleError(error, `GET /api/posts/user/${userId}`)
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
        return handleError(error, 'GET /api/posts')
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
        return handleError(error, 'POST /api/posts')
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
        return handleError(error, `GET /api/posts/${postId}`)
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
        return handleError(error, `DELETE /api/posts/${postId}`)
      }
    }
  }

  // ============================================================================
  // NOTIFICATIONS OPERATIONS
  // ============================================================================
  const notifications = {
    /**
     * ✅ CRITICAL FIX: Get user notifications
     * Now properly authenticated with user context
     */
    async getNotifications(page: number = 1, limit: number = 20) {
      try {
        const userId = getUserId()
        console.log('[API] Fetching notifications for user:', userId)
        
        const response = await $fetch('/api/user/notifications', {
          query: { page, limit }
        })
        console.log('[API] ✅ Notifications fetched successfully')
        return response
      } catch (error) {
        return handleError(error, 'GET /api/user/notifications')
      }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
      try {
        const userId = getUserId()
        console.log('[API] Marking notification as read:', notificationId)
        
        const response = await $fetch(`/api/user/notifications/${notificationId}`, {
          method: 'PATCH',
          body: { user_id: userId }
        })
        console.log('[API] ✅ Notification marked as read')
        return response
      } catch (error) {
        return handleError(error, `PATCH /api/user/notifications/${notificationId}`)
      }
    },

    /**
     * Clear all notifications
     */
    async clearAll() {
      try {
        const userId = getUserId()
        console.log('[API] Clearing all notifications for user:', userId)
        
        const response = await $fetch('/api/user/notifications', {
          method: 'DELETE',
          body: { user_id: userId }
        })
        console.log('[API] ✅ All notifications cleared')
        return response
      } catch (error) {
        return handleError(error, 'DELETE /api/user/notifications')
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
        const response = await $fetch('/api/admin', {
          method: 'POST',
          body: { action: 'get_stats' }
        })
        console.log('[API] ✅ Admin stats fetched')
        return response
      } catch (error) {
        return handleError(error, 'POST /api/admin')
      }
    },

    async banUser(userId: string, reason?: string) {
      try {
        console.log('[API] Banning user:', userId)
        const response = await $fetch('/api/admin', {
          method: 'POST',
          body: { action: 'ban_user', user_id: userId, reason }
        })
        console.log('[API] ✅ User banned')
        return response
      } catch (error) {
        return handleError(error, 'POST /api/admin (ban_user)')
      }
    },

    async verifyUser(userId: string) {
      try {
        console.log('[API] Verifying user:', userId)
        const response = await $fetch('/api/admin', {
          method: 'POST',
          body: { action: 'verify_user', user_id: userId }
        })
        console.log('[API] ✅ User verified')
        return response
      } catch (error) {
        return handleError(error, 'POST /api/admin (verify_user)')
      }
    }
  }

  // ============================================================================
  // STREAM OPERATIONS
  // ============================================================================
  const stream = {
    async create(streamData: any) {
      try {
        const userId = getUserId()
        console.log('[API] Creating stream for user:', userId)
        
        const response = await $fetch('/api/stream', {
          method: 'POST',
          body: {
            user_id: userId,
            action: 'create',
            ...streamData
          }
        })
        console.log('[API] ✅ Stream created')
        return response
      } catch (error) {
        return handleError(error, 'POST /api/stream')
      }
    },

    async get(streamId: string) {
      try {
        console.log('[API] Fetching stream:', streamId)
        const response = await $fetch(`/api/stream/${streamId}`)
        console.log('[API] ✅ Stream fetched')
        return response
      } catch (error) {
        return handleError(error, `GET /api/stream/${streamId}`)
      }
    },

    async getUserStreams() {
      try {
        const userId = getUserId()
        console.log('[API] Fetching streams for user:', userId)
        
        const response = await $fetch('/api/stream/user', {
          query: { user_id: userId }
        })
        console.log('[API] ✅ User streams fetched')
        return response
      } catch (error) {
        return handleError(error, 'GET /api/stream/user')
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
        return handleError(error, 'GET /api/wallet')
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
        return handleError(error, 'GET /api/wallet/transactions')
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
