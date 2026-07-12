// Shared shape for Universe (global) chat messages.
export interface UniverseMessage {
  id: string
  user_id: string
  username: string
  avatar?: string
  content: string
  created_at: string
  likes: number
  replies: number
  liked: boolean
  country?: string
  interest?: string
  language?: string
}
