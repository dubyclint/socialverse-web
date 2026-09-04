export interface Status {
  id: string
  user_id?: string | null
  content: string
  media_type?: string
  media_url?: string | null
  background_color?: string
  text_color?: string
  expires_at?: string | null
  created_at?: string
  views_count?: number
  author_profile?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}
