// FILE: /types/profile.ts - CREATE
// Profile related types
// ============================================================================

export interface CompleteProfileRequest {
  firstName: string
  lastName: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
  interests: string[]
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  bio?: string
  address?: string
  avatarUrl?: string
  website?: string
}

export interface ProfileResponse {
  success: boolean
  message?: string
  profile?: Profile
  nextStep?: string
}

export interface Profile {
  id: string
  email: string
  email_lower: string
  username: string
  username_lower: string
  full_name?: string
  phone?: string
  bio?: string
  location?: string
  avatar_url?: string
  website?: string
  role: string
  status: string
  email_verified: boolean
  profile_completed: boolean
  preferences: Record<string, any>
  metadata: Record<string, any>
  privacy_settings: Record<string, any>
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AvatarUploadResponse {
  success: boolean
  message?: string
  avatarUrl?: string
}

export interface GetProfileResponse {
  success: boolean
  data?: {
    profile: Profile
    ranks: any[]
    wallets: any[]
    privacySettings: any
    userSettings: any
    walletLock: any
    interests: any[]
  }
}
