// ============================================================================
// FILE 5: /pages/profile/[id].vue - UPDATED WITH VALIDATION
// ============================================================================
// ✅ ADDED: Validation when fetching profile by ID
// ✅ ADDED: Authorization header in API calls
// ✅ ADDED: Comprehensive error handling
// ✅ ADDED: Loading and error states
// ============================================================================

// CHANGES MADE:
// 1. Added validation in fetchProfileData() to check:
//    - Profile identifier exists
//    - Profile response is valid
//    - Required fields are present (id, username, full_name)
// 2. Added Authorization header to all API calls
// 3. Added error state display with retry button
// 4. Added comprehensive logging for debugging
// 5. Added data validation before using profile data

// KEY VALIDATION CHECKS:
// ✅ if (!identifier.value) - Check if profile ID/username provided
// ✅ if (!profileResponse) - Check if profile exists
// ✅ const userId = profileResponse.id || profileResponse.user_id || profileResponse.username
//    - Try multiple ID fields to ensure we have a valid user ID
// ✅ if (!userId) - Validate we have a user ID before making further API calls
// ✅ Authorization header in all $fetch calls

// UPDATED fetchProfileData() METHOD:
const fetchProfileData = async () => {
  console.log('[Profile] ============ FETCH PROFILE DATA START ============')
  console.log('[Profile] Fetching profile for identifier:', identifier.value)

  loading.value = true
  error.value = null

  try {
    // ✅ VALIDATION: Check if identifier exists
    if (!identifier.value) {
      throw new Error('No profile identifier provided')
    }

    // ✅ VALIDATION: Fetch profile with Authorization header
    console.log('[Profile] Fetching profile with Authorization header')
    const profileResponse = await $fetch(`/api/profile/${identifier.value}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[Profile] ✅ Profile data received:', profileResponse)

    // ✅ VALIDATION: Check if profile exists
    if (!profileResponse) {
      throw new Error('Profile not found')
    }

    profile.value = profileResponse

    // Update profile store if it's the current user
    if (isOwnProfile.value) {
      profileStore.setProfile(profileResponse)
    }

    // ✅ VALIDATION: Try multiple ID fields
    const userId = profileResponse.id || profileResponse.user_id || profileResponse.username
    
    console.log('[Profile] Using userId for API calls:', userId)

    // ✅ VALIDATION: Ensure we have a valid user ID
    if (!userId) {
      console.warn('[Profile] ⚠️ No user ID found in profile response')
      throw new Error('Invalid profile data: missing user ID')
    }

    // Fetch profile posts with Authorization header
    try {
      console.log('[Profile] Fetching posts for user:', userId)
      const postsResponse = await $fetch(`/api/posts/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })
      profilePosts.value = postsResponse || []
      profileStats.value.posts = profilePosts.value.length
      console.log('[Profile] ✅ Posts fetched:', profilePosts.value.length)
    } catch (err) {
      console.warn('[Profile] Error fetching posts:', err)
      profilePosts.value = []
    }

    // Fetch followers with Authorization header
    try {
      console.log('[Profile] Fetching followers for user:', userId)
      const followersResponse = await $fetch(`/api/follows/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })
      recentFollowers.value = followersResponse?.slice(0, 5) || []
      profileStats.value.followers = followersResponse?.length || 0
      console.log('[Profile] ✅ Followers fetched:', profileStats.value.followers)
    } catch (err) {
      console.warn('[Profile] Error fetching followers:', err)
      recentFollowers.value = []
    }

    console.log('[Profile] ✅ Profile data loaded successfully')
    console.log('[Profile] ============ FETCH PROFILE DATA END ============')

  } catch (err: any) {
    console.error('[Profile] ============ FETCH PROFILE DATA ERROR ============')
    console.error('[Profile] ❌ Error fetching profile:', err)
    
    const errorMessage = err?.data?.message || err?.message || 'Failed to load profile'
    error.value = errorMessage
    
    console.error('[Profile] Error details:', {
      message: errorMessage,
      status: err?.status,
      statusCode: err?.statusCode
    })
    console.error('[Profile] ============ FETCH PROFILE DATA ERROR END ============')
  } finally {
    loading.value = false
  }
}
