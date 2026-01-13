// ============================================================================
// FILE: /types/profile.ts - FIXED WITH ID AND USER_ID SUPPORT
// ============================================================================
// Profile types with rank system & verification badges integrated
// ✅ FIXED: Now accepts both 'id' and 'user_id' fields
// ============================================================================

// ============================================================================
// PROFILE INTERFACE - COMPLETE WITH ALL FIELDS
// ============================================================================
export interface Profile {
  // Primary Keys (both supported for compatibility)
  id?: string  // ✅ NEW: Support 'id' from backend
  user_id?: string  // ✅ EXISTING: Support 'user_id' for frontend

  // Basic Info
  username?: string  // ✅ NEW: Add username field
  email?: string  // ✅ NEW: Add email field
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null

  // Interests (JSONB Array)
  interests?: Interest[]

  // Custom Fields
  colors?: Record<string, any>
  items?: string[]

  // Profile Completion
  profile_completed?: boolean

  // Rank System (INTEGRATED)
  rank?: string // e.g., "Bronze I", "Silver II"
  rank_points?: number
  rank_level?: number

  // Verification Badge System (INTEGRATED)
  is_verified?: boolean
  verified_badge_type?: VerifiedBadgeType | null
  verified_at?: string | null
  verification_status?: VerificationStatus
  badge_count?: number

  // Timestamps
  created_at?: string
  updated_at?: string
}

// ============================================================================
// INTEREST INTERFACE
// ============================================================================
export interface Interest {
  id: string
  name: string
  category: string | null
  icon_url: string | null
}

// ============================================================================
// VERIFIED BADGE TYPES
// ============================================================================
export type VerifiedBadgeType = 'VERIFIED' | 'CREATOR' | 'INFLUENCER' | 'PARTNER' | 'OFFICIAL'

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected'

// ============================================================================
// PROFILE REQUEST/RESPONSE TYPES
// ============================================================================

export interface CompleteProfileRequest {
  full_name: string
  bio: string
  avatar_url?: string
  location?: string
  website?: string
  interests?: string[]
}

export interface UpdateProfileRequest {
  full_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  website?: string
  interests?: string[]
  colors?: Record<string, any>
  items?: string[]
}

export interface ProfileResponse {
  success: boolean
  data?: Profile
  message?: string
  error?: string
}

export interface GetProfileResponse {
  success: boolean
  data: {
    id: string
    email: string
    profile: Profile
    rank: {
      rank: string
      rank_points: number
      rank_level: number
    }
    verification: {
      is_verified: boolean
      verified_badge_type: VerifiedBadgeType | null
      verification_status: VerificationStatus
      badge_count: number
    }
    interests: Interest[]
  }
}

// ============================================================================
// AVATAR UPLOAD RESPONSE
// ============================================================================
export interface AvatarUploadResponse {
  success: boolean
  data?: Profile
  url?: string
  message?: string
  error?: string
}

// ============================================================================
// PROFILE UPDATE RESPONSE
// ============================================================================
export interface ProfileUpdateResponse {
  success: boolean
  data: Profile
  message?: string
  error?: string
}

// ============================================================================
// PROFILE COMPLETION RESPONSE
// ============================================================================
export interface ProfileCompletionResponse {
  success: boolean
  data: Profile
  message?: string
  error?: string
}
