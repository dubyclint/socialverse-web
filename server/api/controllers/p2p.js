// server/api/controllers/p2pController.js
import { supabase } from '../../../utils/supabase.js';

export class P2PController {
  // Create P2P profile
  static async createP2PProfile(req, res) {
    try {
      const {
        user_id,
        display_name,
        bio,
        payment_methods,
        verification_level,
        trading_preferences,
        time_zone,
        languages
      } = req.body;

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('p2p_profiles')
        .select('id')
        .eq('user_id', user_id)
        .single();

      if (existingProfile) {
        return res.status(400).json({ error: 'P2P profile already exists for this user' });
      }

      const { data: profile, error } = await supabase
        .from('p2p_profiles')
        .insert({
          user_id,
          display_name,
          bio,
          payment_methods,
          verification_level: verification_level || 'basic',
          trading_preferences,
          time_zone,
          languages,
          reputation_score: 0,
          total_trades: 0,
          completion_rate: 0,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'P2P profile created successfully',
        data: profile
      });
    } catch (error) {
      console.error('Error creating P2P profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get P2P profile
  static async getP2PProfile(req, res) {
    try {
      const { userId } = req.params;

      const { data: profile, error } = await supabase
        .from('p2p_profiles')
        .select(`
          *,
          users!p2p_profiles_user_id_fkey(id, username, avatar_url, created_at)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error fetching P2P profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update P2P profile
  static async updateP2PProfile(req, res) {
    try {
      const { userId } = req.params;
      const {
        display_name,
        bio,
        payment_methods,
        trading_preferences,
        time_zone,
        languages,
        is_active
      } = req.body;

      const { data: profile, error } = await supabase
        .from('p2p_profiles')
        .update({
          display_name,
          bio,
          payment_methods,
          trading_preferences,
          time_zone,
          languages,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'P2P profile updated successfully',
        data: profile
      });
    } catch (error) {
      console.error('Error updating P2P profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all active P2P traders
  static async getActiveTraders(req, res) {
    try {
      const { page = 1, limit = 20, verification_level, payment_method } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('p2p_profiles')
        .select(`
          *,
          users!p2p_profiles_user_id_fkey(id, username, avatar_url)
        `)
        .eq('is_active', true)
        .order('reputation_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (verification_level) {
        query = query.eq('verification_level', verification_level);
      }

      if (payment_method) {
        query = query.contains('payment_methods', [payment_method]);
      }

      const { data: traders, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: traders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching active traders:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update reputation score
  static async updateReputation(req, res) {
    try {
      const { userId } = req.params;
      const { rating, reviewer_id, trade_id } = req.body;

      // Verify the trade exists and reviewer was part of it
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', trade_id)
        .or(`user_id.eq.${reviewer_id},buyer_id.eq.${reviewer_id}`)
        .single();

      if (tradeError) throw tradeError;

      // Check if rating already exists for this trade
      const { data: existingRating, error: checkError } = await supabase
        .from('p2p_ratings')
        .select('id')
        .eq('trade_id', trade_id)
        .eq('reviewer_id', reviewer_id)
        .single();

      if (existingRating) {
        return res.status(400).json({ error: 'Rating already submitted for this trade' });
      }

      // Add the rating
      await supabase
        .from('p2p_ratings')
        .insert({
          rated_user_id: userId,
          reviewer_id,
          trade_id,
          rating,
          created_at: new Date().toISOString()
        });

      // Calculate new average rating
      const { data: allRatings, error: ratingsError } = await supabase
        .from('p2p_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (ratingsError) throw ratingsError;

      const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

      // Update profile with new reputation score
      const { data: updatedProfile, error: updateError } = await supabase
        .from('p2p_profiles')
        .update({
          reputation_score: Math.round(averageRating * 100) / 100,
          total_ratings: allRatings.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        message: 'Reputation updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error updating reputation:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user ratings and reviews
  static async getUserRatings(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { data: ratings, error } = await supabase
        .from('p2p_ratings')
        .select(`
          *,
          reviewer:users!p2p_ratings_reviewer_id_fkey(id, username, avatar_url),
          trade:trades!p2p_ratings_trade_id_fkey(id, trade_type, currency_from, currency_to)
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: ratings
      });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update trade statistics
  static async updateTradeStats(req, res) {
    try {
      const { userId } = req.params;
      const { trade_completed = false } = req.body;

      const { data: profile, error: fetchError } = await supabase
        .from('p2p_profiles')
        .select('total_trades, successful_trades')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newTotalTrades = (profile.total_trades || 0) + 1;
      const newSuccessfulTrades = trade_completed 
        ? (profile.successful_trades || 0) + 1 
        : (profile.successful_trades || 0);
      
      const completionRate = (newSuccessfulTrades / newTotalTrades) * 100;

      const { data: updatedProfile, error } = await supabase
        .from('p2p_profiles')
        .update({
          total_trades: newTotalTrades,
          successful_trades: newSuccessfulTrades,
          completion_rate: Math.round(completionRate * 100) / 100,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Trade statistics updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error updating trade stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Block/Unblock trader
  static async toggleBlockTrader(req, res) {
    try {
      const { userId } = req.params;
      const { blocker_id, action } = req.body; // action: 'block' or 'unblock'

      if (action === 'block') {
        const { data: block, error } = await supabase
          .from('p2p_blocks')
          .insert({
            blocker_id,
            blocked_id: userId,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          success: true,
          message: 'Trader blocked successfully',
          data: block
        });
      } else {
        const { error } = await supabase
          .from('p2p_blocks')
          .delete()
          .eq('blocker_id', blocker_id)
          .eq('blocked_id', userId);

        if (error) throw error;

        return res.status(200).json({
          success: true,
          message: 'Trader unblocked successfully'
        });
      }
    } catch (error) {
      console.error('Error toggling trader block:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
