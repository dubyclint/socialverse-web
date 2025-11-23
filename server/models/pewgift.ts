// server/models/pewgift.ts - Consolidated PewGift Model
// ============================================================================
// Consolidates: pewgift.js, pewgift-economy.js, pewgift-complete.ts

import { supabase } from '../utils/supabase.js'

export interface GiftType {
  id: string
  name: string
  category: string
  costAmount: number
  rarity: string
  isActive: boolean
  priceInCredits: number
  createdAt: string
  updatedAt: string
}

export interface PewGiftTransaction {
  id: string
  senderId: string
  recipientId: string
  giftId: string
  targetType: 'post' | 'comment' | 'profile'
  targetId: string
  quantity: number
  message?: string
  amount: number
  giftType: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface UserGiftBalance {
  userId: string
  totalCredits: number
  giftsSent: number
  giftsReceived: number
  lastUpdated: string
}

export class PewGiftModel {
  // ============ GIFT TYPE METHODS ============
  
  static async getAllGiftTypes() {
    const { data, error } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: false })
      .order('price_in_credits', { ascending: true })
    if (error) throw error
    return data as GiftType[]
  }

  static async getGiftsByCategory(category: string) {
    const { data, error } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('price_in_credits', { ascending: true })
    if (error) throw error
    return data as GiftType[]
  }

  static async getGiftById(giftId: string) {
    const { data, error } = await supabase
      .from('pewgift_types')
      .select('*')
      .eq('id', giftId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data as GiftType | null
  }

  static async createGiftType(giftData: Omit<GiftType, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('pewgift_types')
      .insert({
        name: giftData.name,
        category: giftData.category,
        cost_amount: giftData.costAmount,
        rarity: giftData.rarity,
        is_active: giftData.isActive,
        price_in_credits: giftData.priceInCredits
      })
      .select()
      .single()
    if (error) throw error
    return data as GiftType
  }

  // ============ GIFT TRANSACTION METHODS ============
  
  static async sendGift(giftData: Omit<PewGiftTransaction, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .insert({
        sender_id: giftData.senderId,
        recipient_id: giftData.recipientId,
        gift_id: giftData.giftId,
        target_type: giftData.targetType,
        target_id: giftData.targetId,
        quantity: giftData.quantity || 1,
        message: giftData.message,
        amount: giftData.amount,
        gift_type: giftData.giftType,
        status: 'completed'
      })
      .select()
      .single()
    if (error) throw error
    return data as PewGiftTransaction
  }

  static async processGiftTransaction(transactionData: {
    senderId: string
    recipientId: string
    postId?: string
    commentId?: string
    amount: number
    giftType?: string
    message?: string
  }) {
    try {
      const { data: transaction, error: transactionError } = await supabase.rpc(
        'process_pew_gift_transaction',
        {
          sender_id: transactionData.senderId,
          recipient_id: transactionData.recipientId,
          post_id: transactionData.postId,
          comment_id: transactionData.commentId,
          gift_amount: transactionData.amount,
          gift_type: transactionData.giftType || 'standard',
          gift_message: transactionData.message
        }
      )
      if (transactionError) throw transactionError
      return {
        success: true,
        transaction: transaction,
        message: 'Gift sent successfully'
      }
    } catch (error) {
      console.error('Error processing gift transaction:', error)
      throw error
    }
  }

  static async getGiftHistory(userId: string, type: 'sent' | 'received' = 'sent', limit = 50) {
    try {
      let query = supabase.from('pew_gifts').select('*').limit(limit)
      if (type === 'sent') {
        query = query.eq('sender_id', userId)
      } else {
        query = query.eq('recipient_id', userId)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as PewGiftTransaction[]
    } catch (error) {
      console.error('Error fetching gift history:', error)
      throw error
    }
  }

  // ============ BALANCE METHODS ============
  
  static async getUserGiftBalance(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_gift_balances')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data as UserGiftBalance | null
    } catch (error) {
      console.error('Error fetching gift balance:', error)
      throw error
    }
  }

  static async updateUserBalance(userId: string, creditsDelta: number) {
    try {
      const { data, error } = await supabase.rpc('update_user_gift_balance', {
        user_id: userId,
        credits_delta: creditsDelta
      })
      if (error) throw error
      return data as UserGiftBalance
    } catch (error) {
      console.error('Error updating balance:', error)
      throw error
    }
  }

  static async getTopGiftReceivers(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('pew_gifts')
        .select('recipient_id, COUNT(*) as gift_count')
        .group_by('recipient_id')
        .order('gift_count', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching top receivers:', error)
      throw error
    }
  }

  // ============ ECONOMY METHODS ============
  
  static async getGiftEconomyStats() {
    try {
      const { data, error } = await supabase.rpc('get_gift_economy_stats')
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching economy stats:', error)
      throw error
    }
  }

  static async validateGiftTransaction(senderId: string, giftId: string, quantity: number) {
    try {
      const balance = await this.getUserGiftBalance(senderId)
      const gift = await this.getGiftById(giftId)
      
      if (!gift) throw new Error('Gift not found')
      if (!balance) throw new Error('User balance not found')
      
      const totalCost = gift.priceInCredits * quantity
      return balance.totalCredits >= totalCost
    } catch (error) {
      console.error('Error validating transaction:', error)
      throw error
    }
  }
}
