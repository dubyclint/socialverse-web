// server/models/rank.ts
// User Rank Model - Ranking system

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type RankType = 'Homie' | 'Pal' | 'BestPal' | 'Legend' | 'Icon'

export interface Rank {
  id: string
  user_id: string
  rank: RankType
  rank_points: number
  rank_level: number
  total_posts: number
  total_likes: number
  total_followers: number
  created_at: string
  updated_at: string
}

export interface UpdateRankInput {
  rankPoints?: number
  totalPosts?: number
  totalLikes?: number
  totalFollowers?: number
}

export class RankModel {
  private static readonly RANK_THRESHOLDS = {
    'Homie': 0,
    'Pal': 100,
    'BestPal': 500,
    'Legend': 1000,
    'Icon': 5000
  }

  static async getByUserId(userId: string): Promise<Rank | null> {
    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as Rank) || null
    } catch (error) {
      console.error('[RankModel] Get by user ID error:', error)
      throw error
    }
  }

  static async create(userId: string): Promise<Rank> {
    try {
      const { data, error } = await supabase
        .from('ranks')
        .insert({
          user_id: userId,
          rank: 'Homie',
          rank_points: 0,
          rank_level: 1,
          total_posts: 0,
          total_likes: 0,
          total_followers: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Rank
    } catch (error) {
      console.error('[RankModel] Create error:', error)
      throw error
    }
  }

  static async addPoints(userId: string, points: number): Promise<Rank> {
    try {
      const rank = await this.getByUserId(userId)
      if (!rank) {
        return await this.create(userId)
      }

      const newPoints = rank.rank_points + points
      const newRank = this.calculateRank(newPoints)

      const { data, error } = await supabase
        .from('ranks')
        .update({
          rank_points: newPoints,
          rank: newRank,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as Rank
    } catch (error) {
      console.error('[RankModel] Add points error:', error)
      throw error
    }
  }

  static async incrementPosts(userId: string): Promise<void> {
    try {
      const rank = await this.getByUserId(userId)
      if (!rank) {
        await this.create(userId)
        return
      }

      await supabase
        .from('ranks')
        .update({
          total_posts: rank.total_posts + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      await this.addPoints(userId, 10)
    } catch (error) {
      console.error('[RankModel] Increment posts error:', error)
      throw error
    }
  }

  static async incrementLikes(userId: string): Promise<void> {
    try {
      const rank = await this.getByUserId(userId)
      if (!rank) {
        await this.create(userId)
        return
      }

      await supabase
        .from('ranks')
        .update({
          total_likes: rank.total_likes + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      await this.addPoints(userId, 5)
    } catch (error) {
      console.error('[RankModel] Increment likes error:', error)
      throw error
    }
  }

  static async incrementFollowers(userId: string): Promise<void> {
    try {
      const rank = await this.getByUserId(userId)
      if (!rank) {
        await this.create(userId)
        return
      }

      await supabase
        .from('ranks')
        .update({
          total_followers: rank.total_followers + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      await this.addPoints(userId, 20)
    } catch (error) {
      console.error('[RankModel] Increment followers error:', error)
      throw error
    }
  }

  static async getLeaderboard(limit: number = 100): Promise<Rank[]> {
    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .order('rank_points', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Rank[]) || []
    } catch (error) {
      console.error('[RankModel] Get leaderboard error:', error)
      throw error
    }
  }

  static async getRankByType(rankType: RankType, limit: number = 50): Promise<Rank[]> {
    try {
      const { data, error } = await supabase
        .from('ranks')
        .select('*')
        .eq('rank', rankType)
        .order('rank_points', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Rank[]) || []
    } catch (error) {
      console.error('[RankModel] Get rank by type error:', error)
      throw error
    }
  }

  private static calculateRank(points: number): RankType {
    if (points >= this.RANK_THRESHOLDS['Icon']) return 'Icon'
    if (points >= this.RANK_THRESHOLDS['Legend']) return 'Legend'
    if (points >= this.RANK_THRESHOLDS['BestPal']) return 'BestPal'
    if (points >= this.RANK_THRESHOLDS['Pal']) return 'Pal'
    return 'Homie'
  }
}

export default RankModel
