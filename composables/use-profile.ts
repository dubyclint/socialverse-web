// FILE: /composables/use-profile.ts (COMPLETE FIXED VERSION)
// ============================================================================
// PROFILE COMPOSABLE - FIXED: Proper API integration
// ============================================================================
// ✅ CRITICAL FIX: Uses the API composable methods correctly
// ✅ Proper error handling and logging
// ✅ Returns data in expected format
// ============================================================================

export const useProfile = () => {
  const { profile, posts } = useApi()

  /**
   * ✅ CRITICAL FIX: Fetch user profile using API composable
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      if (!userId) {
        console.error('[Profile Composable] ❌ User ID is required')
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Fetching profile for user:', userId)

      // ✅ CRITICAL FIX: Use the API composable method
      const response = await profile.getProfile(userId)

      if (!response) {
        console.warn('[Profile Composable] ⚠️ No profile data returned')
        throw new Error('No profile data returned')
      }

      console.log('[Profile Composable] ✅ Profile fetched successfully')
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] ❌ Fetch error:', err.message)
      return null
    }
  }

  /**
   * ✅ CRITICAL FIX: Fetch user posts using API composable
   */
  const fetchUserPosts = async (userId: string, page: number = 1, limit: number = 12) => {
    try {
      if (!userId) {
        console.error('[Profile Composable] ❌ User ID is required')
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Fetching posts for user:', userId, `page: ${page}, limit: ${limit}`)

      // ✅ CRITICAL FIX: Use the API composable method
      const response = await posts.getUserPosts(userId, page, limit)

      if (!response) {
        console.warn('[Profile Composable] ⚠️ No posts data returned')
        return []
      }

      console.log('[Profile Composable] ✅ Posts fetched successfully:', response.posts?.length || 0)
      return response.posts || []
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] ❌ Fetch error:', err.message)
      return []
    }
  }

  /**
   * Update user profile
   */
  const updateUserProfile = async (userId: string, updates: any) => {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      console.log('[Profile Composable] Updating profile for user:', userId)

      const response = await profile.updateProfile(updates)

      if (!response) {
        throw new Error('Failed to update profile')
      }

      console.log('[Profile Composable] ✅ Profile updated successfully')
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] ❌ Update error:', err.message)
      return null
    }
  }

  /**
   * Upload user avatar
   */
  const uploadUserAvatar = async (file: File) => {
    try {
      if (!file) {
        throw new Error('File is required')
      }

      console.log('[Profile Composable] Uploading avatar:', file.name)

      const response = await profile.uploadAvatar(file)

      if (!response) {
        throw new Error('Failed to upload avatar')
      }

      console.log('[Profile Composable] ✅ Avatar uploaded successfully')
      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[Profile Composable] ❌ Upload error:', err.message)
      return null
    }
  }

  return {
    fetchUserProfile,
    fetchUserPosts,
    updateUserProfile,
    uploadUserAvatar
  }
}
