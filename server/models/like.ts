// server/models/like.ts
// Like Model - Likes on posts and comments

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export class LikeModel {
  static async create(input: CreateLikeInput): Promise<Like> {
    try {
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
      console.error('[LikeModel] Create error:', error)
      throw error
    }
  }

  static async delete(userId: string, likeableType: LikeableType, likeableId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('likeable_type', likeableType)
        .eq('likeable_id', likeableId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[LikeModel] Delete error:', error)
      throw error
    }
  }

  static async exists(userId: string, likeableType: LikeableType, likeableId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('likeable_type', likeableType)
        .eq('likeable_id', likeableId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      console.error('[LikeModel] Exists error:', error)
      throw error
    }
  }

  static async getCount(likeableType: LikeableType, likeableId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('likeable_type', likeableType)
        .eq('likeable_id', likeableId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[LikeModel] Get count error:', error)
      throw error
    }
  }

  static async getLikes(likeableType: LikeableType, likeableId: string, limit: number = 50): Promise<Like[]> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('likeable_type', likeableType)
        .eq('likeable_id', likeableId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Like[]) || []
    } catch (error) {
      console.error('[LikeModel] Get likes error:', error)
      throw error
    }
  }

  static async getUserLikes(userId: string, likeableType: LikeableType, limit: number = 50): Promise<Like[]> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('likeable_type', likeableType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Like[]) || []
    } catch (error) {
      console.error('[LikeModel] Get user likes error:', error)
      throw error
    }
  }

  static async toggle(userId: string, likeableType: LikeableType, likeableId: string): Promise<boolean> {
    try {
      const exists = await this.exists(userId, likeableType, likeableId)
      if (exists) {
        await this.delete(userId, likeableType, likeableId)
        return false
      } else {
        await this.create({ userId, likeableType, likeableId })
        return true
      }
    } catch (error) {
      console.error('[LikeModel] Toggle error:', error)
      throw error
    }
  }
}

export default LikeModel
