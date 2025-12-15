// FILE: /types/auth.ts - COMPLETE FIXED VERSION
// ============================================================================
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
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
  bio?: string | null
  email_confirmed_at?: string | null
  user_metadata?: Record<string, any>
  profile?: UserProfile | null
  role?: 'user' | 'manager' | 'admin'
  ranks?: Rank[]
  wallets?: Wallet[]
  privacySettings?: PrivacySettings
  userSettings?: UserSettings
  walletLock?: WalletLock
  interests?: Interest[]
}

export interface UserProfile {
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  verified?: boolean
  profile_completed?: boolean
  created_at?: string
  updated_at?: string
}

export interface Rank {
  id: string
  name: string
  level: number
}

export interface Wallet {
  id: string
  address: string
  balance: number
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends'
  show_email: boolean
  show_location: boolean
}

export interface UserSettings {
  notifications_enabled: boolean
  email_notifications: boolean
  theme: 'light' | 'dark' | 'auto'
  language: string
}

export interface WalletLock {
  locked: boolean
  locked_until?: string
}

export interface Interest {
  id: string
  name: string
  category: string
}
