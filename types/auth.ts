// ============================================================================
// FILE 1: /types/auth.ts - COMPLETE TYPE DEFINITIONS
// ============================================================================
// FIXES:
// ✅ Add Profile type definition
// ✅ Add ProfileStore type
// ✅ Ensure all types are properly defined
// ✅ Add type safety for profile data
// ============================================================================

// ============================================================================
// USER TYPE - Extended with profile data
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
// USER METADATA TYPE
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
// PROFILE TYPE - Complete profile data from profiles table
// ============================================================================
export interface Profile {
  id: string
  username: string
  username_lower: string
  full_name: string
  email: string
  avatar_url: string | null
  bio: string
  location: string
  website?: string
  verified: boolean
  followers_count?: number
  following_count?: number
  posts_count?: number
  created_at: string
  updated_at: string
}

// ============================================================================
// PROFILE STATS TYPE
// ============================================================================
export interface ProfileStats {
  followers_count: number
  following_count: number
  posts_count: number
}

// ============================================================================
// AUTH RESPONSE TYPE
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

// ============================================================================
// LOGIN RESPONSE TYPE
// ============================================================================
export interface LoginResponse {
  success: boolean
  token: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    username: string
    full_name: string
    avatar_url: string | null
  }
}

// ============================================================================
// SIGNUP RESPONSE TYPE
// ============================================================================
export interface SignupResponse {
  success: boolean
  user: {
    id: string
    email: string
    username: string
    display_name: string
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
// PROFILE STORE STATE TYPE
// ============================================================================
export interface ProfileStoreState {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  isHydrated: boolean
}

// ============================================================================
// PROFILE STORE TYPE - For Pinia store
// ============================================================================
export interface IProfileStore {
  // State
  profile: Profile | null
  isLoading: boolean
  error: string | null
  isHydrated: boolean

  // Computed
  username: string
  displayName: string
  avatar: string
  followers: number
  following: number
  posts: number
  isProfileComplete: boolean

  // Methods
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearProfile: () => void
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  hydrateFromStorage: () => Promise<void>
}

// ============================================================================
// AUTH COMPOSABLE RETURN TYPE
// ============================================================================
export interface UseAuthReturn {
  loading: Ref<boolean>
  error: Ref<string | null>
  signup: (credentials: SignupCredentials) => Promise<AuthResponse>
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  logout: () => Promise<AuthResponse>
  verifyEmail: (token: string) => Promise<AuthResponse>
  resetPassword: (email: string) => Promise<AuthResponse>
  updatePassword: (newPassword: string) => Promise<AuthResponse>
  clearError: () => void
  isAuthenticated: ComputedRef<boolean>
  user: ComputedRef<User | null>
  token: ComputedRef<string | null>
}

// ============================================================================
// PROFILE COMPOSABLE RETURN TYPE
// ============================================================================
export interface UseProfileReturn {
  profile: ComputedRef<Profile | null>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  username: ComputedRef<string>
  displayName: ComputedRef<string>
  avatar: ComputedRef<string>
  followers: ComputedRef<number>
  following: ComputedRef<number>
  posts: ComputedRef<number>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  clearError: () => void
}

// ============================================================================
// SIGNUP CREDENTIALS TYPE
// ============================================================================
export interface SignupCredentials {
  email: string
  password: string
  username: string
  fullName?: string
  phone?: string
  bio?: string
  location?: string
}

// ============================================================================
// LOGIN CREDENTIALS TYPE
// ============================================================================
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// ============================================================================
// PROFILE UPDATE TYPE
// ============================================================================
export interface ProfileUpdate {
  full_name?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string | null
}

// ============================================================================
// API ERROR TYPE
// ============================================================================
export interface ApiError {
  statusCode: number
  statusMessage: string
  data?: {
    statusMessage: string
  }
  message?: string
}

// ============================================================================
// PAGINATION TYPE
// ============================================================================
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

// ============================================================================
// PAGINATION RESPONSE TYPE
// ============================================================================
export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
