// server/api/controllers/giftController.js
import { supabase } from '../../../utils/supabase.js';

export class GiftController {
  // Send gift
  static async sendGift(req, res) {
    try {
      const {
        sender_id,
        receiver_id,
        gift_type,
        gift_name,
        gift_value,
        message,
        is_anonymous
      } = req.body;

      if (sender_id === receiver_id) {
        return res.status(400).json({ error: 'Cannot send gift to yourself' });
      }

      // Check sender's wallet balance if gift has value
      if (gift_value > 0) {
        const { data: wallet, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', sender_id)
          .eq('currency_code', 'USDT') // Assuming gifts are paid with USDT
          .single();

        if (walletError) throw walletError;

        if (parseFloat(wallet.balance) < parseFloat(gift_value)) {
          return res.status(400).json({ error: 'Insufficient balance to send gift' });
        }

        // Deduct from sender's wallet
        await supabase
          .from('wallets')
          .update({
            balance: parseFloat(wallet.balance) - parseFloat(gift_value),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', sender_id)
          .eq('currency_code', 'USDT');

        // Add to receiver's wallet
        const { data: receiverWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', receiver_id)
          .eq('currency_code', 'USDT')
          .single();

        if (receiverWallet) {
          await supabase
            .from('wallets')
            .update({
              balance: parseFloat(receiverWallet.balance) + parseFloat(gift_value),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', receiver_id)
            .eq('currency_code', 'USDT');
        }
      }

      const { data: gift, error } = await supabase
        .from('gifts')
        .insert({
          sender_id,
          receiver_id,
          gift_type,
          gift_name,
          gift_value: gift_value || 0,
          message,
          is_anonymous: is_anonymous || false,
          status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Gift sent successfully',
        data: gift
      });
    } catch (error) {
      console.error('Error sending gift:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get received gifts
  static async getReceivedGifts(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: gifts, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:users!gifts_sender_id_fkey(id, username, avatar_url)
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Hide sender info for anonymous gifts
      const processedGifts = gifts.map(gift => ({
        ...gift,
        sender: gift.is_anonymous ? null : gift.sender
      }));

      return res.status(200).json({
        success: true,
        data: processedGifts
      });
    } catch (error) {
      console.error('Error fetching received gifts:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get sent gifts
  static async getSentGifts(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: gifts, error } = await supabase
        .from('gifts')
        .select(`
          *,
          receiver:users!gifts_receiver_id_fkey(id, username, avatar_url)
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: gifts
      });
    } catch (error) {
      console.error('Error fetching sent gifts:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get available gift types
  static async getGiftTypes(req, res) {
    try {
      const giftTypes = [
        { id: 1, name: 'Rose', emoji: '🌹', value: 1.0, category: 'romantic' },
        { id: 2, name: 'Heart', emoji: '❤️', value: 2.0, category: 'romantic' },
        { id: 3, name: 'Diamond', emoji: '💎', value: 10.0, category: 'luxury' },
        { id: 4, name: 'Crown', emoji: '👑', value: 25.0, category: 'luxury' },
        { id: 5, name: 'Rocket', emoji: '🚀', value: 50.0, category: 'premium' },
        { id: 6, name: 'Coffee', emoji: '☕', value: 0.5, category: 'casual' },
        { id: 7, name: 'Beer', emoji: '🍺', value: 3.0, category: 'casual' },
        { id: 8, name: 'Cake', emoji: '🎂', value: 5.0, category: 'celebration' }
      ];

      return res.status(200).json({
        success: true,
        data: giftTypes
      });
    } catch (error) {
      console.error('Error fetching gift types:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Accept gift
  static async acceptGift(req, res) {
    try {
      const { giftId } = req.params;
      const { user_id } = req.body;

      const { data: gift, error } = await supabase
        .from('gifts')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', giftId)
        .eq('receiver_id', user_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Gift accepted successfully',
        data: gift
      });
    } catch (error) {
      console.error('Error accepting gift:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Decline gift
  static async declineGift(req, res) {
    try {
      const { giftId } = req.params;
      const { user_id } = req.body;

      // Get gift details first
      const { data: giftDetails, error: fetchError } = await supabase
        .from('gifts')
        .select('*')
        .eq('id', giftId)
        .eq('receiver_id', user_id)
        .single();

      if (fetchError) throw fetchError;

      // Refund sender if gift has value
      if (giftDetails.gift_value > 0) {
        const { data: senderWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', giftDetails.sender_id)
          .eq('currency_code', 'USDT')
          .single();

        if (senderWallet) {
          await supabase
            .from('wallets')
            .update({
              balance: parseFloat(senderWallet.balance) + parseFloat(giftDetails.gift_value),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', giftDetails.sender_id)
            .eq('currency_code', 'USDT');
        }
      }

      const { data: gift, error } = await supabase
        .from('gifts')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('id', giftId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Gift declined successfully',
        data: gift
      });
    } catch (error) {
      console.error('Error declining gift:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get gift statistics
  static async getGiftStats(req, res) {
    try {
      const { userId } = req.params;

      // Get sent gifts stats
      const { data: sentStats, error: sentError } = await supabase
        .from('gifts')
        .select('gift_value')
        .eq('sender_id', userId);

      if (sentError) throw sentError;

      // Get received gifts stats
      const { data: receivedStats, error: receivedError } = await supabase
        .from('gifts')
        .select('gift_value')
        .eq('receiver_id', userId)
        .eq('status', 'accepted');

      if (receivedError) throw receivedError;

      const totalSent = sentStats.reduce((sum, gift) => sum + parseFloat(gift.gift_value), 0);
      const totalReceived = receivedStats.reduce((sum, gift) => sum + parseFloat(gift.gift_value), 0);

      return res.status(200).json({
        success: true,
        data: {
          gifts_sent: sentStats.length,
          gifts_received: receivedStats.length,
          total_value_sent: totalSent,
          total_value_received: totalReceived
        }
      });
    } catch (error) {
      console.error('Error fetching gift stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send pew gift (special gift type)
  static async sendPewGift(req, res) {
    try {
      const {
        sender_id,
        receiver_id,
        pew_id,
        gift_type,
        gift_name,
        gift_value
      } = req.body;

      // Verify the pew exists and sender is part of it
      const { data: pew, error: pewError } = await supabase
        .from('pews')
        .select('*')
        .eq('id', pew_id)
        .or(`sender_id.eq.${sender_id},receiver_id.eq.${sender_id}`)
        .single();

      if (pewError) throw pewError;

      const { data: pewGift, error } = await supabase
        .from('pew_gifts')
        .insert({
          sender_id,
          receiver_id,
          pew_id,
          gift_type,
          gift_name,
          gift_value: gift_value || 0,
          status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Pew gift sent successfully',
        data: pewGift
      });
    } catch (error) {
      console.error('Error sending pew gift:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
