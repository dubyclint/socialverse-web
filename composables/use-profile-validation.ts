// ============================================================================
// FILE: /composables/use-profile-validation.ts - NEW HELPER COMPOSABLE
// ============================================================================
// ✅ NEW: Validates profile data and ensures user_id is always present
// ============================================================================

import type { Profile } from '~/types/profile'

/**
 * Validate profile data and ensure user_id is present
 */
export const useProfileValidation = () => {
  /**
   * Validate profile has a user ID
   */
  const validateProfileHasUserId = (profile: any): boolean => {
    if (!profile) {
      console.error('[Profile Validation] ❌ Profile is null or undefined')
      return false
    }

    // Check for either id or user_id
    const userId = profile.user_id || profile.id

    if (!userId) {
      console.error('[Profile Validation] ❌ Profile missing user ID')
      console.error('[Profile Validation] Available fields:', Object.keys(profile))
      return false
    }

    console.log('[Profile Validation] ✅ Profile has valid user ID:', userId)
    return true
  }

  /**
   * Normalize profile to ensure both id and user_id are set
   */
  const normalizeProfileData = (rawProfile: any): Profile => {
    console.log('[Profile Validation] Normalizing profile data...')

    if (!rawProfile) {
      throw new Error('Invalid profile data: profile is null')
    }

    // Extract user ID from either field
    const userId = rawProfile.user_id || rawProfile.id

    if (!userId) {
      console.error('[Profile Validation] ❌ No user ID found in profile')
      console.error('[Profile Validation] Profile keys:', Object.keys(rawProfile))
      throw new Error('Invalid profile data: missing user ID')
    }

    // Normalize the profile
    const normalized: Profile = {
      ...rawProfile,
      id: userId,  // Ensure id is set
      user_id: userId,  // Ensure user_id is set
      full_name: rawProfile.full_name || null,
      bio: rawProfile.bio || null,
      avatar_url: rawProfile.avatar_url || null,
      location: rawProfile.location || null,
      website: rawProfile.website || null,
      username: rawProfile.username || '',
      email: rawProfile.email || '',
      interests: rawProfile.interests || [],
      colors: rawProfile.colors || {},
      items: rawProfile.items || [],
      profile_completed: rawProfile.profile_completed || false,
      rank: rawProfile.rank || 'Bronze I',
      rank_points: rawProfile.rank_points || 0,
      rank_level: rawProfile.rank_level || 1,
      is_verified: rawProfile.is_verified || false,
      verified_badge_type: rawProfile.verified_badge_type || null,
      verified_at: rawProfile.verified_at || null,
      verification_status: rawProfile.verification_status || 'none',
      badge_count: rawProfile.badge_count || 0,
      created_at: rawProfile.created_at || new Date().toISOString(),
      updated_at: rawProfile.updated_at || new Date().toISOString()
    }

    console.log('[Profile Validation] ✅ Profile normalized:', {
      id: normalized.id,
      user_id: normalized.user_id,
      username: normalized.username,
      full_name: normalized.full_name
    })

    return normalized
  }

  /**
   * Get user ID from profile (checks both id and user_id)
   */
  const getUserIdFromProfile = (profile: any): string | null => {
    if (!profile) return null
    return profile.user_id || profile.id || null
  }

  /**
   * Validate profile response from API
   */
  const validateProfileResponse = (response: any): Profile => {
    console.log('[Profile Validation] ============ VALIDATE RESPONSE START ============')

    if (!response) {
      console.error('[Profile Validation] ❌ Response is null or undefined')
      throw new Error('Invalid profile data: response is empty')
    }

    console.log('[Profile Validation] Response keys:', Object.keys(response))

    // Check if response has data wrapper
    let profileData = response.data || response

    if (!profileData) {
      console.error('[Profile Validation] ❌ No profile data in response')
      throw new Error('Invalid profile data: no data field')
    }

    console.log('[Profile Validation] Profile data keys:', Object.keys(profileData))

    // Validate and normalize
    const normalized = normalizeProfileData(profileData)

    console.log('[Profile Validation] ============ VALIDATE RESPONSE END ============')
    return normalized
  }

  return {
    validateProfileHasUserId,
    normalizeProfileData,
    getUserIdFromProfile,
    validateProfileResponse
  }
}
