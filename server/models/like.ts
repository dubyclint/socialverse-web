// FILE: /server/models/like.ts
// Like Model - Likes on posts and comments
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
// TYPES & INTERFACES
// ============================================================================
export type LikeableType = 'post' | 'comment' | 'profile'

export interface Like {
  id: string
  user_id: string
  likeable_type: LikeableType
  likeable_id: string
  created_at: string
}

export interface CreateLikeInput {
  userId: string
  likeableType: LikeableType
  likeableId: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class LikeModel {
  static async createLike(input: CreateLikeInput): Promise<Like> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('likes')
        .insert({
          user_id: input.userId,
          likeable_type: input.likeableType,
          likeable_id: input.likeableId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Like
    } catch (error) {
      console.error('[LikeModel] Error creating like:', error)
      throw error
    }
  }

  static async removeLike(userId: string, likeableType: LikeableType, likeableId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('likeable_type', likeableType)
        .eq('likeable_id', likeableId)

      if (error) throw error
    } catch (error) {
      console.error('[LikeModel] Error removing like:', error)
      throw error
    }
  }

  // ... rest of the methods
}
