// FILE: /server/models/comment.ts
// Comment Model - Post comments and replies
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
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

// ============================================================================
// MODEL CLASS
// ============================================================================
export class CommentModel {
  static async createComment(postId: string, userId: string, content: string): Promise<Comment> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          likes_count: 0,
          replies_count: 0
        })
        .select()
        .single()

      if (error) throw error
      return data as Comment
    } catch (error) {
      console.error('[CommentModel] Error creating comment:', error)
      throw error
    }
  }

  static async getCommentsByPost(postId: string, limit = 20, offset = 0): Promise<Comment[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as Comment[]
    } catch (error) {
      console.error('[CommentModel] Error fetching comments:', error)
      throw error
    }
  }

  // ... rest of the methods
}
