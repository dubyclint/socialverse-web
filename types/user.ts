// ============================================================================
// FILE: /types/user.ts
// Description: Canonical authenticated-user (session context) type for the web
// client. This is the shape held by `useUserStore().user` — the Supabase auth
// user augmented with the app-specific fields consumed across pages/components.
// ============================================================================

import type { VerificationStatus, VerifiedBadgeType } from '~/types/profile'

export interface CallRecord {
  id: string
  status: 'missed' | 'answered' | 'declined' | 'outgoing' | 'incoming'
  isViewed?: boolean
  peerId?: string
  peerName?: string
  timestamp?: number | string
}

export interface StreamSettings {
  title?: string | null
  quality?: string | null
  key?: string | null
}

export interface UserMetadata {
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
  [key: string]: unknown
}

/**
 * Authenticated user / session context.
 * `id`, `email`, `user_metadata` come from Supabase auth; the remaining fields
 * are app profile data merged onto the session user.
 */
export interface AuthUser {
  // Supabase auth identity
  id: string
  email?: string | null
  user_metadata?: UserMetadata

  // App profile fields merged onto the session user
  username?: string | null
  handle?: string | null
  full_name?: string | null
  avatar?: string | null
  avatar_url?: string | null
  bio?: string | null
  role?: string | null
  status?: string | null

  // Flags
  is_verified?: boolean
  is_premium?: boolean
  verified_badge_type?: VerifiedBadgeType | null
  verification_status?: VerificationStatus

  // Product settings
  stream_settings?: StreamSettings

  // Timestamps
  created_at?: string | null
  updated_at?: string | null
}
