// FILE: /types/interests.ts - CREATE
// Interests related types
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
}
