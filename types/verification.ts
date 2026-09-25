// Verification/badge request domain types.
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface BadgeRequest {
  id: string
  user_id?: string
  name: string
  social_link?: string
  doc_url?: string | null
  status: VerificationStatus
  created_at?: string
  updated_at?: string
}

export interface VerificationStatusResponse {
  status: VerificationStatus
}
