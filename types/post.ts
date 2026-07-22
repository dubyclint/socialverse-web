import type { Database } from './database.types'

export type PostRow = Database['public']['Tables']['posts']['Row']

// UI-facing post shape: the DB row plus optional joined/derived fields used in views.
export interface Post extends PostRow {
  privacy?: 'public' | 'friends' | 'private'
  tags?: string[]
  mentions?: string[]
  media?: Array<{ url: string; type: string }>
  likes_count?: number
  comments_count?: number
  shares_count?: number
  is_liked?: boolean
  author_profile?: {
    id: string
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
  } | null
}

export interface PostsPage {
  posts: Post[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
