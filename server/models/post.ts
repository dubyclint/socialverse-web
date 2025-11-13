// server/models/post.ts - Post Model for Supabase
import { supabase } from '../utils/supabase'

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

export class Post {
  /**
   * Get all non-deleted posts
   */
  static async getAllPosts(page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit

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
      console.error('Error fetching all posts:', error)
      throw error
    }
  }

  /**
   * Get posts by user ID (non-deleted only)
   */
  static async getPostsByUserId(userId: string, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit

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
      console.error('Error fetching user posts:', error)
      throw error
    }
  }

  /**
   * Get a single post by ID
   */
  static async getPostById(postId: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .is('is_deleted', false)
        .single()

      if (error) throw error

      return {
        success: true,
        post: data
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      throw error
    }
  }

  /**
   * Create a new post
   */
  static async createPost(postData: PostData) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: postData.user_id,
          content: postData.content,
          title: postData.title || null,
          media_url: postData.media_url || null,
          media_type: postData.media_type || 'text',
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        post: data
      }
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  /**
   * Update a post
   */
  static async updatePost(postId: string, updates: Partial<PostData>) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        post: data
      }
    } catch (error) {
      console.error('Error updating post:', error)
      throw error
    }
  }

  /**
   * Soft delete a post (mark as deleted, don't remove from DB)
   */
  static async deletePost(postId: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Post deleted successfully'
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      throw error
    }
  }

  /**
   * Get posts with media only
   */
  static async getMediaPosts(userId: string, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('is_deleted', false)
        .not('media_url', 'is', null)
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
      console.error('Error fetching media posts:', error)
      throw error
    }
  }

  /**
   * Get liked posts for a user
   */
  static async getLikedPosts(userId: string, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .in('id', 
          supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', userId)
        )
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
      console.error('Error fetching liked posts:', error)
      throw error
    }
  }
}
