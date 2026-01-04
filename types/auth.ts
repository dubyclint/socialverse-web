// ============================================================================
// FILE: /types/auth.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Auth types with complete user data and profile integration
// ============================================================================

import type { Profile, VerifiedBadgeType, VerificationStatus } from './profile'

// ============================================================================
// USER INTERFACE - EXTENDED WITH PROFILE DATA
// ============================================================================
export interface User {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email_confirmed_at: string | null
  user_metadata?: UserMetadata
  role?: string
}

// ============================================================================
// USER METADATA INTERFACE
// ============================================================================
export interface UserMetadata {
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
  followers_count?: number
  following_count?: number
  posts_count?: number
  profile_completed?: boolean
  [key: string]: any
}

// ============================================================================
// COMPLETE USER PROFILE INTERFACE
// ============================================================================
export interface UserProfile {
  // Auth User Data
  id: string
  email: string
  username: string

  // Profile Data
  profile: Profile

  // Rank Data
  rank: string
  rank_points: number
  rank_level: number

  // Verification Data
  is_verified: boolean
  verified_badge_type: VerifiedBadgeType | null
  verification_status: VerificationStatus

  // Stats
  followers_count: number
  following_count: number
  posts_count: number
}

// ============================================================================
// AUTH RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string | null
  refreshToken?: string | null
  expiresIn?: number | null
  needsConfirmation?: boolean
  error?: string
}

export interface LoginResponse {
  success: boolean
  token: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    username: string
    full_name: string | null
    avatar_url: string | null
    rank: string
    rank_points: number
    rank_level: number
    is_verified: boolean
  }
}

export interface SignupResponse {
  success: boolean
  user: {
    id: string
    email: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  token: string | null
  refreshToken: string | null
  expiresIn: number | null
  needsConfirmation: boolean
  message: string
}

// ============================================================================
// AUTH STORE STATE TYPE
// ============================================================================
export interface AuthStoreState {
  token: string | null
  userId: string | null
  user: User | null
  isLoading: boolean
  error: string | null
  isHydrated: boolean
  rememberMe: boolean
}

// ============================================================================
// CREDENTIALS TYPES
// ============================================================================

export interface SignupCredentials {
  email: string
  password: string
  username: string
  fullName?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// ============================================================================
// API ERROR TYPE
// ============================================================================
export interface ApiError {
  statusCode: number
  statusMessage: string
  data?: {
    statusMessage: string
    details?: any
  }
  message?: string
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
