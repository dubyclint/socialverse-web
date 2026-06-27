// server/utils/gift-operations-utils.ts
import { supabase } from './auth-utils'

export const giftOperations = {
  async sendGift(senderId: string, recipientId: string, giftData: any) {
    try {
      const { giftId, amount, message } = giftData
      
      const { data: gift, error } = await supabase
        .from('gifts')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          gift_id: giftId,
          amount,
          message,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return gift
    } catch (error) {
      console.error('[Gift] Send error:', error)
      throw error
    }
  },

  async getGiftHistory(userId: string) {
    try {
      const { data: gifts, error } = await supabase
        .from('gifts')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return gifts
    } catch (error) {
      console.error('[Gift] History error:', error)
      throw error
    }
  },

  async getGiftStats(userId: string) {
    try {
      const { data: sent, error: sentError } = await supabase
        .from('gifts')
        .select('amount')
        .eq('sender_id', userId)

      const { data: received, error: receivedError } = await supabase
        .from('gifts')
        .select('amount')
        .eq('recipient_id', userId)

      if (sentError || receivedError) throw sentError || receivedError

      const totalSent = sent?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0
      const totalReceived = received?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0

      return {
        totalSent,
        totalReceived,
        sentCount: sent?.length || 0,
        receivedCount: received?.length || 0
      }
    } catch (error) {
      console.error('[Gift] Stats error:', error)
      throw error
    }
  }
}
