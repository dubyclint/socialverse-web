// FILE: /types/auth.ts - CREATE
// Authentication related types
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  username: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface CheckUsernameRequest {
  username: string
}

export interface CheckUsernameResponse {
  available: boolean
  reason?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  message?: string
  user?: User
  nextStep?: string
}

export interface User {
  id: string
  email: string
  username: string
  role: 'user' | 'manager' | 'admin'
  profile: UserProfile
  ranks: Rank[]
  wallets: Wallet[]
  privacySettings: PrivacySettings
  userSettings: UserSettings
  walletLock: WalletLock
  interests: Interest[]
}

export interface UserProfile {
  full_name?: string
  phone?: string
  bio?: string
  location?: string
  avatar_url?: string
  website?: string
  email_verified: boolean
  profile_completed: boolean
  status: 'active' | 'suspended' | 'banned'
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Rank {
  id: string
  user_id: string
  category: 'trading' | 'social' | 'content' | 'overall'
  current_rank: string
  rank_level: number
  points: number
  next_rank: string
  points_to_next: number
  achievements: string[]
  season_start: string
}

export interface Wallet {
  id: string
  user_id: string
  currency_code: string
  currency_name: string
  balance: number
  locked_balance: number
  wallet_address?: string
  wallet_type: string
  is_locked: boolean
}

export interface PrivacySettings {
  id?: string
  user_id?: string
  show_profile_views: boolean
  show_online_status: boolean
  allow_messages: boolean
  allow_friend_requests: boolean
  show_email: boolean
  show_phone: boolean
  show_location: boolean
  show_interests: boolean
  profile_visibility: 'public' | 'private' | 'friends_only'
}

export interface UserSettings {
  id?: string
  user_id?: string
  notifications_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  theme: 'light' | 'dark'
  language: string
  two_factor_enabled: boolean
  backup_codes: string[]
}

export interface WalletLock {
  id?: string
  user_id?: string
  is_locked: boolean
  locked_until?: string
  lock_reason?: string
}

export interface Interest {
  id: string
  name: string
  description?: string
  category: string
  icon_url?: string
  is_active: boolean
}
