// ============================================================================
// FILE: /types/verification.ts - NEW FILE
// ============================================================================
// Verification badge types
// ============================================================================

// ============================================================================
// BADGE REQUEST INTERFACE
// ============================================================================
export interface BadgeRequest {
  id: string
  user_id: string
  name: string
  social_link: string
  doc_url?: string
  status: BadgeRequestStatus
  created_at: string
  updated_at: string
}

// ============================================================================
// VERIFIED BADGE INTERFACE
// ============================================================================
export interface VerifiedBadge {
  id: string
  user_id: string
  badge_type: VerifiedBadgeType
  is_active: boolean
  reason?: string
  awarded_at: string
  expires_at?: string
  awarded_by?: string
  created_at: string
}

// ============================================================================
// BADGE TYPES
// ============================================================================
export type VerifiedBadgeType = 'VERIFIED' | 'CREATOR' | 'INFLUENCER' | 'PARTNER' | 'OFFICIAL'

export type BadgeRequestStatus = 'pending' | 'approved' | 'rejected'

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface SubmitVerificationRequest {
  name: string
  socialLink: string
  docUrl?: string
}

export interface VerificationStatusResponse {
  success: boolean
  status: BadgeRequestStatus
  createdAt?: string
  updatedAt?: string
  error?: string
}

export interface VerificationResponse {
  success: boolean
  data?: BadgeRequest | VerifiedBadge
  message?: string
  error?: string
}

export interface ApproveBadgeRequest {
  userId: string
  badgeType: VerifiedBadgeType
  reason?: string
}

export interface ApproveBadgeResponse {
  success: boolean
  data: VerifiedBadge
  message?: string
  error?: string
}

// ============================================================================
// BADGE CONFIGURATION
// ============================================================================
export const BADGE_TYPES: Record<VerifiedBadgeType, { label: string; description: string; icon: string }> = {
  VERIFIED: {
    label: 'Verified',
    description: 'Identity verified',
    icon: '✓'
  },
  CREATOR: {
    label: 'Creator',
    description: 'Content creator',
    icon: '🎬'
  },
  INFLUENCER: {
    label: 'Influencer',
    description: 'Influencer account',
    icon: '⭐'
  },
  PARTNER: {
    label: 'Partner',
    description: 'Official partner',
    icon: '🤝'
  },
  OFFICIAL: {
    label: 'Official',
    description: 'Official account',
    icon: '🏛️'
  }
}
