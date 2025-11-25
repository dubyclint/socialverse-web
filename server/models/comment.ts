// server/models/comment.ts
// Comment Model - Post comments and replies

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_comment_id?: string
  content: string
  mentions?: string[]
  created_at: string
  updated_at: string
  deleted_at?: string
  is_deleted: boolean
  likes_count: number
  replies_count: number
}

export interface CreateCommentInput {
  postId: string
  userId: string
  content: string
  parentCommentId?: string
  mentions?: string[]
}

export class CommentModel {
  static async create(input: CreateCommentInput): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: input.postId,
          user_id: input.userId,
          parent_comment_id: input.parentCommentId,
          content: input.content,
          mentions: input.mentions || [],
          is_deleted: false,
          likes_count: 0,
          replies_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Comment
    } catch (error) {
      console.error('[CommentModel] Create error:', error)
      throw error
    }
  }

  static async getById(commentId: string): Promise<Comment | null> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as Comment) || null
    } catch (error) {
      console.error('[CommentModel] Get by ID error:', error)
      throw error
    }
  }

  static async getPostComments(postId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { comments: (data as Comment[]) || [], total: count || 0 }
    } catch (error) {
      console.error('[CommentModel] Get post comments error:', error)
      throw error
    }
  }

  static async getReplies(commentId: string, limit: number = 20): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_comment_id', commentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data as Comment[]) || []
    } catch (error) {
      console.error('[CommentModel] Get replies error:', error)
      throw error
    }
  }

  static async update(commentId: string, userId: string, content: string): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as Comment
    } catch (error) {
      console.error('[CommentModel] Update error:', error)
      throw error
    }
  }

  static async delete(commentId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[CommentModel] Delete error:', error)
      throw error
    }
  }

  static async incrementLikes(commentId: string): Promise<void> {
    try {
      const { data: comment } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single()

      await supabase
        .from('comments')
        .update({ likes_count: (comment?.likes_count || 0) + 1 })
        .eq('id', commentId)
    } catch (error) {
      console.error('[CommentModel] Increment likes error:', error)
      throw error
    }
  }

  static async decrementLikes(commentId: string): Promise<void> {
    try {
      const { data: comment } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single()

      await supabase
        .from('comments')
        .update({ likes_count: Math.max(0, (comment?.likes_count || 1) - 1) })
        .eq('id', commentId)
    } catch (error) {
      console.error('[CommentModel] Decrement likes error:', error)
      throw error
    }
  }

  static async getUserComments(userId: string, limit: number = 50): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Comment[]) || []
    } catch (error) {
      console.error('[CommentModel] Get user comments error:', error)
      throw error
    }
  }
}

export default CommentModel
