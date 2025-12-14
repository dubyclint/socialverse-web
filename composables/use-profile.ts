// FILE: /composables/use-profile.ts (COMPLETE FIXED VERSION)
// ============================================================================
// PROFILE COMPOSABLE - FIXED: Proper API integration
// ============================================================================

export const useProfile = () => {
  const { profile, posts } = useApi()

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Fetching profile for user:', userId)

      // ✅ CRITICAL FIX: Use the API composable method
      const response = await profile.getProfile(userId)

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

  const fetchUserPosts = async (userId: string, page: number = 1, limit: number = 12) => {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Fetching posts for user:', userId)

      // ✅ CRITICAL FIX: Use the API composable method
      const response = await posts.getUserPosts(userId, page, limit)

      if (!response) {
        throw new Error('No posts data returned')
      }

      console.log('[Profile Composable] Posts fetched successfully:', response.posts?.length || 0)
      return response.posts || []
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] Fetch error:', err.message)
      return []
    }
  }

  return {
    fetchUserProfile,
    fetchUserPosts
  }
}
