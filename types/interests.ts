// ============================================================================
// FILE: /types/interests.ts - COMPLETE UPDATED VERSION
// ============================================================================
// Interest types for user interests management
// ============================================================================

// ============================================================================
// INTEREST INTERFACE
// ============================================================================
export interface Interest {
  id: string
  name: string
  description?: string
  category: string
  icon_url?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// ============================================================================
// USER INTEREST INTERFACE
// ============================================================================
export interface UserInterest {
  id: string
  user_id: string
  interest_id: string
  interest: Interest
  created_at: string
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListInterestsResponse {
  success: boolean
  interests: Interest[]
  grouped: Record<string, Interest[]>
  total: number
}

export interface UserInterestsResponse {
  success: boolean
  interests: Interest[]
  grouped: Record<string, Interest[]>
  total: number
}

export interface AddInterestRequest {
  interestId: string
}

export interface RemoveInterestRequest {
  interestId: string
}

export interface InterestResponse {
  success: boolean
  message?: string
  error?: string
}

// ============================================================================
// INTEREST CATEGORY TYPE
// ============================================================================
export type InterestCategory = 
  | 'Technology'
  | 'Sports'
  | 'Entertainment'
  | 'Music'
  | 'Art'
  | 'Travel'
  | 'Food'
  | 'Fashion'
  | 'Gaming'
  | 'Education'
  | 'Business'
  | 'Health'
  | 'Other'
