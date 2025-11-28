// ============================================================================
// FILE: /composables/use-profile.ts
// ============================================================================
// ✅ FIXED: Added proper error handling for profile fetching

export const useProfile = () => {
  const fetchUserProfile = async (userId: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Fetching profile for user:', userId)

      const response = await $fetch(`/api/profile/${userId}`, {
        method: 'GET',
      })

      if (!response) {
        throw new Error('No profile data returned')
      }

      console.log('[Profile Composable] Profile fetched successfully')
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] Fetch error:', err.message)
      throw err
    }
  }

  const fetchUserPosts = async (userId: string, limit = 20, offset = 0) => {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Fetching posts for user:', userId)

      const response = await $fetch(`/api/profile/${userId}/posts`, {
        method: 'GET',
        query: { limit, offset }
      })

      if (!Array.isArray(response)) {
        console.warn('[Profile Composable] Posts response is not an array')
        return []
      }

      console.log('[Profile Composable] Posts fetched successfully:', response.length)
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] Fetch posts error:', err.message)
      return []
    }
  }

  const updateUserProfile = async (userId: string, data: any) => {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Updating profile for user:', userId)

      const response = await $fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        body: data
      })

      console.log('[Profile Composable] Profile updated successfully')
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] Update error:', err.message)
      throw err
    }
  }

  return {
    fetchUserProfile,
    fetchUserPosts,
    updateUserProfile
  }
}
