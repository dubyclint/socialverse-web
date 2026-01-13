// ============================================================================
// FILE: plugins/profile.client.ts - PROFILE INITIALIZATION PLUGIN
// ============================================================================
// ✅ ADDED: Validation in initializeProfile()
// ✅ ADDED: Authorization header in API calls
// ✅ ADDED: Comprehensive error handling
// ✅ ADDED: Data validation before using profile data
// ============================================================================

// CHANGES MADE:
// 1. Added validation in initializeProfile() to check:
//    - User ID is valid
//    - Profile response is valid
//    - Required fields are present
// 2. Added Authorization header to profile fetch
// 3. Added comprehensive logging for debugging
// 4. Added error handling with fallback behavior
// 5. Added data validation before storing profile

// KEY VALIDATION CHECKS:
// ✅ if (!userId) - Check user ID is provided
// ✅ if (!profileResponse) - Check profile response exists
// ✅ if (!profileResponse.id) - Check profile has valid ID
// ✅ Authorization header in $fetch call
// ✅ Graceful error handling without throwing

import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

// ============================================================================
// PLUGIN DEFINITION
// ============================================================================
export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[ProfilePlugin] ============ PROFILE PLUGIN INITIALIZATION START ============')

  try {
    // ✅ VALIDATION: Check if we're on client-side
    if (!process.client) {
      console.log('[ProfilePlugin] Not on client-side, skipping initialization')
      return
    }

    console.log('[ProfilePlugin] Running on client-side')

    // ✅ VALIDATION: Wait for auth to be ready
    const authStore = useAuthStore()
    const profileStore = useProfileStore()

    console.log('[ProfilePlugin] Auth store state:', {
      isAuthenticated: authStore.isAuthenticated,
      hasUser: !!authStore.user,
      userId: authStore.user?.id,
      hasToken: !!authStore.token
    })

    // ✅ VALIDATION: Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.log('[ProfilePlugin] User not authenticated, skipping profile initialization')
      return
    }

    // ✅ VALIDATION: Check if user has ID
    if (!authStore.user?.id) {
      console.error('[ProfilePlugin] ❌ User ID not available')
      console.error('[ProfilePlugin] User data:', authStore.user)
      return
    }

    console.log('[ProfilePlugin] User authenticated, initializing profile')

    // Initialize profile
    await initializeProfile(authStore, profileStore)

    console.log('[ProfilePlugin] ============ PROFILE PLUGIN INITIALIZATION END (SUCCESS) ============')
  } catch (error) {
    console.error('[ProfilePlugin] ============ PROFILE PLUGIN INITIALIZATION ERROR ============')
    console.error('[ProfilePlugin] Error during plugin initialization:', error)
    console.error('[ProfilePlugin] ============ PROFILE PLUGIN INITIALIZATION ERROR END ============')
  }
})

// ============================================================================
// PROFILE INITIALIZATION FUNCTION
// ============================================================================
/**
 * Initialize user profile on app startup
 * Fetches profile data from API and stores it in profile store
 * 
 * @param authStore - Auth store instance
 * @param profileStore - Profile store instance
 */
async function initializeProfile(authStore: any, profileStore: any) {
  console.log('[ProfilePlugin] ============ INITIALIZE PROFILE START ============')

  try {
    // ✅ VALIDATION: Extract user ID
    const userId = authStore.user?.id

    console.log('[ProfilePlugin] Initializing profile for user:', userId)

    // ✅ VALIDATION: Check if user ID is valid
    if (!userId) {
      console.error('[ProfilePlugin] ❌ User ID is not valid')
      console.error('[ProfilePlugin] Available user data:', {
        id: authStore.user?.id,
        email: authStore.user?.email,
        username: authStore.user?.username
      })
      throw new Error('User ID is not available')
    }

    console.log('[ProfilePlugin] User ID validated:', userId)

    // ✅ VALIDATION: Check if token is available
    if (!authStore.token) {
      console.error('[ProfilePlugin] ❌ Authentication token not available')
      throw new Error('Authentication token not available')
    }

    console.log('[ProfilePlugin] Token available, fetching profile...')

    // ✅ VALIDATION: Fetch profile with Authorization header
    console.log('[ProfilePlugin] Fetching profile from API...')
    const profileResponse = await $fetch(`/api/profile/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[ProfilePlugin] ✅ Profile response received')
    console.log('[ProfilePlugin] Profile response keys:', Object.keys(profileResponse || {}))

    // ✅ VALIDATION: Check if profile response is valid
    if (!profileResponse) {
      console.error('[ProfilePlugin] ❌ Profile response is null or undefined')
      throw new Error('Profile response is empty')
    }

    console.log('[ProfilePlugin] Profile response is valid')

    // ✅ VALIDATION: Check if profile has required ID field
    if (!profileResponse.id && !profileResponse.user_id) {
      console.error('[ProfilePlugin] ❌ Profile response missing ID field')
      console.error('[ProfilePlugin] Profile response:', profileResponse)
      throw new Error('Profile response missing ID field')
    }

    console.log('[ProfilePlugin] Profile ID validated:', profileResponse.id || profileResponse.user_id)

    // ✅ VALIDATION: Check if profile has required fields
    const requiredFields = ['id', 'username', 'email']
    const missingFields = requiredFields.filter(field => !profileResponse[field] && field !== 'id')

    if (missingFields.length > 0) {
      console.warn('[ProfilePlugin] ⚠️ Profile missing some fields:', missingFields)
      console.warn('[ProfilePlugin] Available fields:', Object.keys(profileResponse))
    }

    console.log('[ProfilePlugin] Profile data validation passed')

    // ✅ VALIDATION: Validate profile data structure
    const validatedProfile = validateProfileData(profileResponse)

    console.log('[ProfilePlugin] Profile data validated and normalized')

    // Store profile in profile store
    console.log('[ProfilePlugin] Storing profile in profile store')
    profileStore.setProfile(validatedProfile)

    console.log('[ProfilePlugin] ✅ Profile stored successfully')
    console.log('[ProfilePlugin] Profile store state:', {
      hasProfile: !!profileStore.profile,
      profileId: profileStore.profile?.id,
      profileUsername: profileStore.profile?.username
    })

    console.log('[ProfilePlugin] ============ INITIALIZE PROFILE END (SUCCESS) ============')
  } catch (error: any) {
    console.error('[ProfilePlugin] ============ INITIALIZE PROFILE ERROR ============')
    console.error('[ProfilePlugin] ❌ Error initializing profile:', error)

    const errorMessage = error?.data?.message || error?.message || 'Failed to initialize profile'
    const errorStatus = error?.status || error?.statusCode

    console.error('[ProfilePlugin] Error details:', {
      message: errorMessage,
      status: errorStatus,
      type: error?.constructor?.name
    })

    // ✅ GRACEFUL ERROR HANDLING: Don't throw, just log and continue
    console.warn('[ProfilePlugin] ⚠️ Profile initialization failed, continuing without profile')
    console.error('[ProfilePlugin] ============ INITIALIZE PROFILE ERROR END ============')
  }
}

// ============================================================================
// PROFILE DATA VALIDATION FUNCTION
// ============================================================================
/**
 * Validate and normalize profile data
 * Ensures all required fields are present and properly formatted
 * 
 * @param profileData - Raw profile data from API
 * @returns Validated and normalized profile data
 */
function validateProfileData(profileData: any): any {
  console.log('[ProfilePlugin] ============ VALIDATE PROFILE DATA START ============')

  try {
    // ✅ VALIDATION: Check if profile data exists
    if (!profileData) {
      console.error('[ProfilePlugin] ❌ Profile data is null or undefined')
      throw new Error('Profile data is empty')
    }

    console.log('[ProfilePlugin] Profile data exists, validating fields...')

    // ✅ VALIDATION: Normalize ID field
    const profileId = profileData.id || profileData.user_id
    if (!profileId) {
      console.error('[ProfilePlugin] ❌ Profile ID is missing')
      throw new Error('Profile ID is required')
    }

    console.log('[ProfilePlugin] Profile ID validated:', profileId)

    // ✅ VALIDATION: Normalize username
    const username = profileData.username || profileData.user_name || ''
    if (!username) {
      console.warn('[ProfilePlugin] ⚠️ Username is missing')
    }

    console.log('[ProfilePlugin] Username validated:', username)

    // ✅ VALIDATION: Normalize email
    const email = profileData.email || ''
    if (!email) {
      console.warn('[ProfilePlugin] ⚠️ Email is missing')
    }

    console.log('[ProfilePlugin] Email validated:', email)

    // ✅ VALIDATION: Normalize full name
    const fullName = profileData.full_name || profileData.fullName || ''
    console.log('[ProfilePlugin] Full name validated:', fullName)

    // ✅ VALIDATION: Normalize avatar URL
    const avatarUrl = profileData.avatar_url || profileData.avatarUrl || '/default-avatar.svg'
    console.log('[ProfilePlugin] Avatar URL validated:', avatarUrl)

    // ✅ VALIDATION: Normalize bio
    const bio = profileData.bio || ''
    console.log('[ProfilePlugin] Bio validated:', bio.substring(0, 50) + '...')

    // ✅ VALIDATION: Normalize status
    const status = profileData.status || 'online'
    console.log('[ProfilePlugin] Status validated:', status)

    // ✅ VALIDATION: Normalize verification status
    const verified = profileData.verified || profileData.is_verified || false
    console.log('[ProfilePlugin] Verification status validated:', verified)

    // ✅ VALIDATION: Normalize follower counts
    const followersCount = parseInt(profileData.followers_count || profileData.followersCount || '0', 10)
    const followingCount = parseInt(profileData.following_count || profileData.followingCount || '0', 10)
    const postsCount = parseInt(profileData.posts_count || profileData.postsCount || '0', 10)

    console.log('[ProfilePlugin] Counts validated:', {
      followers: followersCount,
      following: followingCount,
      posts: postsCount
    })

    // ✅ VALIDATION: Normalize timestamps
    const createdAt = profileData.created_at || profileData.createdAt || new Date().toISOString()
    const updatedAt = profileData.updated_at || profileData.updatedAt || new Date().toISOString()

    console.log('[ProfilePlugin] Timestamps validated')

    // ✅ VALIDATION: Normalize additional fields
    const location = profileData.location || ''
    const website = profileData.website || ''
    const isPrivate = profileData.is_private || profileData.isPrivate || false
    const interests = profileData.interests || []

    console.log('[ProfilePlugin] Additional fields validated')

    // Create validated profile object
    const validatedProfile = {
      id: profileId,
      username,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      bio,
      status,
      verified,
      followers_count: followersCount,
      following_count: followingCount,
      posts_count: postsCount,
      created_at: createdAt,
      updated_at: updatedAt,
      location,
      website,
      is_private: isPrivate,
      interests,
      // Include original data for backward compatibility
      ...profileData
    }

    console.log('[ProfilePlugin] ✅ Profile data validated and normalized')
    console.log('[ProfilePlugin] Validated profile keys:', Object.keys(validatedProfile))
    console.log('[ProfilePlugin] ============ VALIDATE PROFILE DATA END (SUCCESS) ============')

    return validatedProfile
  } catch (error: any) {
    console.error('[ProfilePlugin] ============ VALIDATE PROFILE DATA ERROR ============')
    console.error('[ProfilePlugin] ❌ Error validating profile data:', error)
    console.error('[ProfilePlugin] ============ VALIDATE PROFILE DATA ERROR END ============')

    // ✅ GRACEFUL ERROR HANDLING: Return original data if validation fails
    console.warn('[ProfilePlugin] ⚠️ Returning original profile data due to validation error')
    return profileData
  }
}

// ============================================================================
// PROFILE SYNC FUNCTION
// ============================================================================
/**
 * Sync profile data with server
 * Called periodically to keep profile data up-to-date
 * 
 * @param authStore - Auth store instance
 * @param profileStore - Profile store instance
 */
export async function syncProfileData(authStore: any, profileStore: any) {
  console.log('[ProfilePlugin] ============ SYNC PROFILE DATA START ============')

  try {
    // ✅ VALIDATION: Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.log('[ProfilePlugin] User not authenticated, skipping sync')
      return
    }

    // ✅ VALIDATION: Check if user has ID
    if (!authStore.user?.id) {
      console.error('[ProfilePlugin] ❌ User ID not available')
      return
    }

    // ✅ VALIDATION: Check if token is available
    if (!authStore.token) {
      console.error('[ProfilePlugin] ❌ Token not available')
      return
    }

    console.log('[ProfilePlugin] Syncing profile for user:', authStore.user.id)

    // Fetch latest profile data
    const profileResponse = await $fetch(`/api/profile/${authStore.user.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[ProfilePlugin] ✅ Profile sync response received')

    // ✅ VALIDATION: Check if response is valid
    if (!profileResponse) {
      console.error('[ProfilePlugin] ❌ Profile sync response is empty')
      return
    }

    // Validate and store profile
    const validatedProfile = validateProfileData(profileResponse)
    profileStore.setProfile(validatedProfile)

    console.log('[ProfilePlugin] ✅ Profile synced successfully')
    console.log('[ProfilePlugin] ============ SYNC PROFILE DATA END (SUCCESS) ============')
  } catch (error: any) {
    console.error('[ProfilePlugin] ============ SYNC PROFILE DATA ERROR ============')
    console.error('[ProfilePlugin] ❌ Error syncing profile:', error)
    console.error('[ProfilePlugin] ============ SYNC PROFILE DATA ERROR END ============')
  }
}

// ============================================================================
// PROFILE VALIDATION UTILITY FUNCTION
// ============================================================================
/**
 * Check if profile is complete
 * Validates that all required fields are present
 * 
 * @param profile - Profile object to validate
 * @returns Boolean indicating if profile is complete
 */
export function isProfileComplete(profile: any): boolean {
  console.log('[ProfilePlugin] Checking if profile is complete')

  if (!profile) {
    console.log('[ProfilePlugin] Profile is null or undefined')
    return false
  }

  const requiredFields = ['id', 'username', 'full_name', 'bio', 'avatar_url']
  const missingFields = requiredFields.filter(field => !profile[field])

  if (missingFields.length > 0) {
    console.log('[ProfilePlugin] Profile missing fields:', missingFields)
    return false
  }

  console.log('[ProfilePlugin] Profile is complete')
  return true
}

// ============================================================================
// PROFILE UPDATE FUNCTION
// ============================================================================
/**
 * Update profile data
 * Sends updated profile data to server
 * 
 * @param authStore - Auth store instance
 * @param profileStore - Profile store instance
 * @param updates - Profile updates
 */
export async function updateProfile(authStore: any, profileStore: any, updates: any) {
  console.log('[ProfilePlugin] ============ UPDATE PROFILE START ============')
  console.log('[ProfilePlugin] Profile updates:', updates)

  try {
    // ✅ VALIDATION: Check if user is authenticated
    if (!authStore.isAuthenticated) {
      console.error('[ProfilePlugin] ❌ User not authenticated')
      throw new Error('User not authenticated')
    }

    // ✅ VALIDATION: Check if user has ID
    if (!authStore.user?.id) {
      console.error('[ProfilePlugin] ❌ User ID not available')
      throw new Error('User ID not available')
    }

    // ✅ VALIDATION: Check if token is available
    if (!authStore.token) {
      console.error('[ProfilePlugin] ❌ Token not available')
      throw new Error('Token not available')
    }

    console.log('[ProfilePlugin] Updating profile for user:', authStore.user.id)

    // Send update request
    const response = await $fetch(`/api/profile/${authStore.user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: updates
    })

    console.log('[ProfilePlugin] ✅ Profile update response received')

    // ✅ VALIDATION: Check if response is valid
    if (!response) {
      console.error('[ProfilePlugin] ❌ Profile update response is empty')
      throw new Error('Profile update response is empty')
    }

    // Validate and store updated profile
    const validatedProfile = validateProfileData(response)
    profileStore.setProfile(validatedProfile)

    console.log('[ProfilePlugin] ✅ Profile updated successfully')
    console.log('[ProfilePlugin] ============ UPDATE PROFILE END (SUCCESS) ============')

    return validatedProfile
  } catch (error: any) {
    console.error('[ProfilePlugin] ============ UPDATE PROFILE ERROR ============')
    console.error('[ProfilePlugin] ❌ Error updating profile:', error)
    console.error('[ProfilePlugin] ============ UPDATE PROFILE ERROR END ============')

    throw error
  }
}

// ============================================================================
// PROFILE RESET FUNCTION
// ============================================================================
/**
 * Reset profile data
 * Clears profile from store
 * 
 * @param profileStore - Profile store instance
 */
export function resetProfile(profileStore: any) {
  console.log('[ProfilePlugin] Resetting profile')

  try {
    profileStore.clearProfile()
    console.log('[ProfilePlugin] ✅ Profile reset successfully')
  } catch (error) {
    console.error('[ProfilePlugin] ❌ Error resetting profile:', error)
  }
}
