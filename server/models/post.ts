// FILE: /server/models/post.ts
// Post Model for Supabase
// REFACTORED: Use lazy-loaded getSupabase function

import { getSupabase } from '../utils/supabase'

// ============================================================================
// INTERFACES
// ============================================================================
export interface PostData {
  id?: string
  user_id: string
  content: string
  title?: string
  media_url?: string
  media_type?: 'image' | 'video' | 'text'
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  is_deleted?: boolean
  likes_count?: number
  comments_count?: number
  shares_count?: number
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class Post {
  /**
   * Get all non-deleted posts
   */
  static async getAllPosts(page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit
      const supabase = await getSupabase()

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .is('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        posts: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (page * limit) < (count || 0)
      }
    } catch (error) {
      console.error('[Post] Error fetching all posts:', error)
      throw error
    }
  }

  /**
   * Get posts by user
   */
  static async getPostsByUser(userId: string, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit
      const supabase = await getSupabase()

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        posts: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (page * limit) < (count || 0)
      }
    } catch (error) {
      console.error('[Post] Error fetching user posts:', error)
      throw error
    }
  }

  // ... rest of the methods
}
