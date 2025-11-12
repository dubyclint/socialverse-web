// server/models/stream-pewgift.js - Supabase PostgreSQL Stream Pew Gift Model
import { supabase } from '../utils/supabase.js';

export class StreamPewGift {
  /**
   * Create a new pew gift record
   */
  static async create(giftData) {
    try {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalValue = giftData.giftValue * (giftData.quantity || 1);
      const platformFee = Math.round(totalValue * 0.3); // 30% platform fee
      const streamerRevenue = totalValue - platformFee;

      const { data, error } = await supabase
        .from('stream_pew_gifts')
        .insert({
          stream_id: giftData.streamId,
          sender_id: giftData.senderId,
          receiver_id: giftData.receiverId,
          gift_id: giftData.giftId,
          gift_name: giftData.giftName,
          gift_image: giftData.giftImage,
          gift_value: giftData.giftValue,
          quantity: giftData.quantity || 1,
          total_value: totalValue,
          timestamp: new Date().toISOString(),
          message: giftData.message || null,
          is_anonymous: giftData.isAnonymous || false,
          animation_type: giftData.animationType || 'normal',
          combo_count: giftData.comboCount || 1,
          display_duration: giftData.displayDuration || 3000,
          transaction_id: transactionId,
          status: 'pending',
          platform_fee: platformFee,
          streamer_revenue: streamerRevenue,
          sender_username: giftData.senderUsername,
          sender_avatar: giftData.senderAvatar || null,
          receiver_username: giftData.receiverUsername,
          device_type: giftData.deviceType || 'desktop'
        })
        .select(`
          *,
          sender:sender_id(username, avatar_url),
          receiver:receiver_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating pew gift:', error);
      throw error;
    }
  }

  /**
   * Get gifts by stream
   */
  static async getByStream(streamId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('stream_pew_gifts')
        .select(`
          *,
          sender:sender_id(username, avatar_url),
          receiver:receiver_id(username, avatar_url)
        `, { count: 'exact' })
        .eq('stream_id', streamId)
        .eq('status', 'completed')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching stream gifts:', error);
      throw error;
    }
  }

  /**
   * Get gifts sent by user
   */
  static async getBySender(senderId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('stream_pew_gifts')
        .select(`
          *,
          receiver:receiver_id(username, avatar_url)
        `, { count: 'exact' })
        .eq('sender_id', senderId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching sender gifts:', error);
      throw error;
    }
  }

  /**
   * Get gifts received by user
   */
  static async getByReceiver(receiverId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('stream_pew_gifts')
        .select(`
          *,
          sender:sender_id(username, avatar_url)
        `, { count: 'exact' })
        .eq('receiver_id', receiverId)
        .eq('status', 'completed')
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching receiver gifts:', error);
      throw error;
    }
  }

  /**
   * Update gift status
   */
  static async updateStatus(giftId, status) {
    try {
      const { data, error } = await supabase
        .from('stream_pew_gifts')
        .update({ status })
        .eq('id', giftId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating gift status:', error);
      throw error;
    }
  }

  /**
   * Get gift statistics for stream
   */
  static async getStreamStats(streamId) {
    try {
      const { data, error } = await supabase
        .from('stream_pew_gifts')
        .select('total_value, platform_fee, streamer_revenue, status')
        .eq('stream_id', streamId)
        .eq('status', 'completed');

      if (error) throw error;

      const stats = {
        totalGifts: data.length,
        totalValue: data.reduce((sum, g) => sum + (g.total_value || 0), 0),
        platformFees: data.reduce((sum, g) => sum + (g.platform_fee || 0), 0),
        streamerRevenue: data.reduce((sum, g) => sum + (g.streamer_revenue || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching stream stats:', error);
      throw error;
    }
  }

  /**
   * Get user gift statistics
   */
  static async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .from('stream_pew_gifts')
        .select('total_value, quantity')
        .eq('sender_id', userId)
        .eq('status', 'completed');

      if (error) throw error;

      const stats = {
        totalGiftsSent: data.length,
        totalSpent: data.reduce((sum, g) => sum + (g.total_value || 0), 0),
        totalQuantity: data.reduce((sum, g) => sum + (g.quantity || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error fetching user gift stats:', error);
      throw error;
    }
  }

  /**
   * Get top gifts
   */
  static async getTopGifts(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('stream_pew_gifts')
        .select('gift_id, gift_name, gift_image, COUNT(*) as count, SUM(total_value) as total_value')
        .eq('status', 'completed')
        .group_by('gift_id, gift_name, gift_image')
        .order('count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching top gifts:', error);
      throw error;
    }
  }

  /**
   * Delete gift record
   */
  static async delete(giftId) {
    try {
      const { error } = await supabase
        .from('stream_pew_gifts')
        .delete()
        .eq('id', giftId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting gift:', error);
      throw error;
    }
  }
}
