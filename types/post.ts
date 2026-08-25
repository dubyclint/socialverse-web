import type { Database } from './database.types'

export type PostRow = Database['public']['Tables']['posts']['Row']

// UI-facing post shape: the DB row plus optional joined/derived fields used in views.
export interface Post extends Omit<PostRow, 'privacy'> {
  privacy?: 'public' | 'friends' | 'private' | string
  tags?: string[]
  mentions?: string[]
  media?: Array<{ url: string; type: string }>
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
