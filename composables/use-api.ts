// FILE 2: /composables/use-api.ts
// ============================================================================
// API COMPOSABLE - FIXED: Proper error handling and $fetch usage
// ============================================================================

import type { FetchOptions } from 'ofetch'

export const useApi = () => {
  const { $fetch } = useNuxtApp()
  const authStore = useAuthStore()

  /**
   * ✅ CRITICAL: Get user ID from auth store
   * Returns null if user is not authenticated (instead of throwing)
   */
  const getUserId = (): string | null => {
    const userId = authStore.user?.id || authStore.userId
    
    if (!userId) {
      console.warn('[API] ⚠️ User not authenticated - no user ID available')
      return null
    }
    
    console.log('[API] ✅ Using user ID:', userId)
    return userId
  }

  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================
  const profile = {
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

    async getProfile(userId?: string) {
      try {
        const id = userId || getUserId()
        
        if (!id) {
          console.warn('[API] ⚠️ Cannot fetch profile - no user ID provided')
          return null
        }
        
        console.log('[API] Fetching profile for user:', id)
        const response = await $fetch(`/api/profile/${id}`)
        console.log('[API] ✅ Profile fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching profile:', error)
        return null
      }
    },

    async updateProfile(updates: any) {
      try {
        const userId = getUserId()
        
        if (!userId) {
          console.warn('[API] ⚠️ Cannot update profile - user not authenticated')
          return null
        }
        
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

    async completeProfile(profileData: any) {
      try {
        const userId = getUserId()
        
        if (!userId) {
          console.warn('[API] ⚠️ Cannot complete profile - user not authenticated')
          return null
        }
        
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

    async uploadAvatar(file: File) {
      try {
        const userId = getUserId()
        
        if (!userId) {
          console.warn('[API] ⚠️ Cannot upload avatar - user not authenticated')
          return null
        }
        
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
    async getUserPosts(userId?: string, page: number = 1, limit: number = 12) {
      try {
        const id = userId || getUserId()
        
        if (!id) {
          console.warn('[API] ⚠️ Cannot fetch posts - no user ID provided')
          return { posts: [], total: 0, page, limit, has_more: false }
        }
        
        console.log('[API] Fetching posts for user:', id, `page: ${page}, limit: ${limit}`)
        const response = await $fetch(`/api/posts/user/${id}`, {
          query: { page, limit }
        })
        console.log('[API] ✅ Posts fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching posts:', error)
        return { posts: [], total: 0, page, limit, has_more: false }
      }
    },

    async getFeed(page: number = 1, limit: number = 12) {
      try {
        console.log('[API] Fetching feed posts...')
        const response = await $fetch('/api/posts/feed', {
          query: { page, limit }
        })
        console.log('[API] ✅ Feed posts fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching feed:', error)
        return { posts: [], total: 0, page, limit, has_more: false }
      }
    },

    async createPost(content: string, media?: File[]) {
      try {
        const userId = getUserId()
        
        if (!userId) {
          console.warn('[API] ⚠️ Cannot create post - user not authenticated')
          return null
        }
        
        console.log('[API] Creating post for user:', userId)
        
        const formData = new FormData()
        formData.append('content', content)
        formData.append('user_id', userId)
        
        if (media && media.length > 0) {
          media.forEach((file, index) => {
            formData.append(`media_${index}`, file)
          })
        }
        
        const response = await $fetch('/api/posts/create', {
          method: 'POST',
          body: formData
        })
        console.log('[API] ✅ Post created successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error creating post:', error)
        return null
      }
    }
  }

  // ============================================================================
  // NOTIFICATIONS OPERATIONS
  // ============================================================================
  const notifications = {
    async getNotifications(page: number = 1, limit: number = 20) {
      try {
        console.log('[API] Fetching notifications...')
        const response = await $fetch('/api/user/notifications', {
          query: { page, limit }
        })
        console.log('[API] ✅ Notifications fetched successfully')
        return response
      } catch (error) {
        console.error('[API] ❌ Error fetching notifications:', error)
        return { notifications: [], total: 0, page, limit, has_more: false }
      }
    }
  }

  return {
    profile,
    posts,
    notifications,
    getUserId
  }
}
