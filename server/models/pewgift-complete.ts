// server/models/pewgift-complete.ts - COMPLETE PEWGIFT MODEL
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export class PewGiftModel {
  /**
   * Get all active gift types
   */
  static async getAllGiftTypes(supabase: any) {
    const { data, error } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: false })
      .order('price_in_credits', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get gift types by category
   */
  static async getGiftsByCategory(supabase: any, category: string) {
    const { data, error } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('price_in_credits', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get user's gift balance
   */
  static async getUserBalance(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('pew_balance, locked_balance, lifetime_earned, lifetime_spent')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Create wallet if doesn't exist
      return this.createUserWallet(supabase, userId)
    }

    return {
      balance: data.pew_balance,
      locked_balance: data.locked_balance || 0,
      lifetime_earned: data.lifetime_earned || 0,
      lifetime_spent: data.lifetime_spent || 0
    }
  }

  /**
   * Create user wallet
   */
  static async createUserWallet(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        pew_balance: 0,
        locked_balance: 0,
        lifetime_earned: 0,
        lifetime_spent: 0
      })
      .select()
      .single()

    if (error) throw error
    return {
      balance: 0,
      locked_balance: 0,
      lifetime_earned: 0,
      lifetime_spent: 0
    }
  }

  /**
   * Get gift transaction history
   */
  static async getTransactionHistory(supabase: any, userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        gift_type:gift_type_id(name, emoji, image_url, rarity),
        sender:sender_id(username, avatar_url),
        recipient:recipient_id(username, avatar_url)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  /**
   * Get received gifts
   */
  static async getReceivedGifts(supabase: any, userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        gift_type:gift_type_id(name, emoji, image_url, rarity, animation_url),
        sender:sender_id(username, avatar_url, id)
      `)
      .eq('recipient_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  /**
   * Get sent gifts
   */
  static async getSentGifts(supabase: any, userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        gift_type:gift_type_id(name, emoji, image_url, rarity),
        recipient:recipient_id(username, avatar_url, id)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  /**
   * Get gift leaderboard
   */
  static async getLeaderboard(supabase: any, limit = 50, timeframe = '30d') {
    const { data, error } = await supabase
      .from('pewgift_leaderboard')
      .select(`
        *,
        user:user_id(username, avatar_url, verified)
      `)
      .eq('timeframe', timeframe)
      .order('total_gifts_sent', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Get gift statistics for user
   */
  static async getUserGiftStats(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from('pewgift_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return {
        total_gifts_sent: 0,
        total_gifts_received: 0,
        total_value_sent: 0,
        total_value_received: 0,
        favorite_gift_type: null,
        favorite_recipient: null
      }
    }

    return data
  }

  /**
   * Lock user balance (premium feature)
   */
  static async lockBalance(supabase: any, userId: string, isLocked: boolean) {
    const { data, error } = await supabase
      .from('user_wallets')
      .update({ is_locked: isLocked })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
