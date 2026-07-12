// ============================================================================
// FILE: /types/profile.ts
// Description: Canonical profile type definitions for the web client.
// ============================================================================

export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say'
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type VerifiedBadgeType = 'VERIFIED' | 'CREATOR' | 'INFLUENCER' | 'PARTNER' | 'OFFICIAL'

export interface Interest {
  id: string
  name: string
  category?: string | null
  icon_url?: string | null
}

export interface Profile {
  // Identity
  id?: string
  user_id: string

  // Core Properties (✅ RECONCILED: Relaxed to optional + nullable to support canonical field normalization)
  username?: string | null
  email?: string | null
  full_name?: string | null      // Frontend alias
  display_name?: string | null   // Backend canonical
  bio?: string | null

  // Media / Public Fields
  avatar_url?: string | null
  location?: string | null
  website?: string | null
  birth_date?: string | null
  gender?: Gender | null
  is_private?: boolean

  // Verification & Status Properties
  profile_completed?: boolean
  is_verified?: boolean
  verified_badge_type?: VerifiedBadgeType | null
  verification_status?: VerificationStatus
  verified_at?: string | null
  badge_count?: number

  // Gamification & Product Ranks
  rank?: string
  rank_points?: number
  rank_level?: number

  // Aggregated Counters & Metrics
  followers_count?: number
  following_count?: number
  posts_count?: number
  wallet_balance?: number

  // Core Collections
  interests?: Interest[]
  colors?: Record<string, any>
  items?: string[]

  // Auditing Timestamps
  created_at?: string
  updated_at?: string | null
}

export interface ProfileUpdateInput {
  // Canonical update properties
  full_name?: string
  display_name?: string
  bio?: string
  avatar_url?: string | null
  location?: string | null
  website?: string | null
  birth_date?: string | null
  gender?: Gender | null
  is_private?: boolean

  // Extended mutations
  username?: string | null
  interests?: string[] | Interest[]
  colors?: Record<string, any>
  items?: string[]
}

export interface ProfileCompleteInput {
  full_name?: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  location?: string | null
  website?: string | null
  birth_date?: string | null
  gender?: Gender | null
  is_private?: boolean

  // Canonical onboarding payload
  interests?: string[]
}

export interface AvatarUploadData {
  avatar_url: string
}

export interface ProfileMeData extends Profile {}
export interface ProfileByIdData extends Profile {}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Endpoint-Specific Layout Response Aliases
export type ProfileMeResponse = ApiResponse<ProfileMeData>
export type ProfileByIdResponse = ApiResponse<ProfileByIdData>
export type ProfileUpdateResponse = ApiResponse<Profile>
export type ProfileCompletionResponse = ApiResponse<Profile>
export type AvatarUploadResponse = ApiResponse<AvatarUploadData>
export type InterestsResponse = ApiResponse<{ interests: Interest[] } | Interest[]>
