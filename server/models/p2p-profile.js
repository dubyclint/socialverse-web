// server/models/p2p-profile.js - Supabase PostgreSQL P2P Profile Model
import { supabase } from '../utils/supabase.js';

export class P2PProfile {
  /**
   * Create a new P2P profile
   */
  static async create(profileData) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .insert([{
          user_id: profileData.userId,
          trading_name: profileData.tradingName,
          bio: profileData.bio,
          preferred_currencies: profileData.preferredCurrencies || [],
          supported_payment_methods: profileData.supportedPaymentMethods || [],
          min_trade_amount: profileData.minTradeAmount,
          max_trade_amount: profileData.maxTradeAmount,
          trading_hours: profileData.tradingHours,
          kyc_status: 'pending',
          is_active: true
        }])
        .select(`
          *,
          profiles:user_id(username, avatar_url, reputation_score)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating P2P profile:', error);
      throw error;
    }
  }

  /**
   * Get P2P profile by user ID
   */
  static async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .select(`
          *,
          profiles:user_id(username, avatar_url, reputation_score, total_trades, successful_trades)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching P2P profile:', error);
      throw error;
    }
  }

  /**
   * Update P2P profile
   */
  static async updateProfile(userId, updateData) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select(`
          *,
          profiles:user_id(username, avatar_url, reputation_score)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating P2P profile:', error);
      throw error;
    }
  }

  /**
   * Update KYC status
   */
  static async updateKYCStatus(userId, status, documents = null) {
    try {
      const updateData = { kyc_status: status };
      if (documents) {
        updateData.kyc_documents = documents;
      }

      const { data, error } = await supabase
        .from('p2p_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }

  /**
   * Get verified traders
   */
  static async getVerifiedTraders(limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('p2p_profiles')
        .select(`
          *,
          profiles:user_id(username, avatar_url, reputation_score, total_trades, successful_trades)
        `, { count: 'exact' })
        .eq('kyc_status', 'verified')
        .eq('is_active', true)
        .order('total_volume', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching verified traders:', error);
      throw error;
    }
  }

  /**
   * Search traders with filters
   */
  static async searchTraders(filters = {}, limit = 50, offset = 0) {
    try {
      let query = supabase
        .from('p2p_profiles')
        .select(`
          *,
          profiles:user_id(username, avatar_url, reputation_score, total_trades, successful_trades)
        `, { count: 'exact' })
        .eq('is_active', true);

      if (filters.currency) {
        query = query.contains('preferred_currencies', [filters.currency]);
      }
      if (filters.paymentMethod) {
        query = query.contains('supported_payment_methods', [filters.paymentMethod]);
      }
      if (filters.verifiedOnly) {
        query = query.eq('kyc_status', 'verified');
      }
      if (filters.minRating) {
        query = query.gte('profiles.reputation_score', filters.minRating);
      }

      const { data, error, count } = await query
        .order('total_volume', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error searching traders:', error);
      throw error;
    }
  }

  /**
   * Update trading statistics
   */
  static async updateTradingStats(userId, volumeIncrease, isSuccessful = true) {
    try {
      const profile = await this.getByUserId(userId);

      if (!profile) {
        throw new Error('P2P profile not found');
      }

      const newVolume = (profile.total_volume || 0) + volumeIncrease;
      const totalTrades = (profile.total_trades || 0) + 1;
      const successfulTrades = isSuccessful ? (profile.successful_trades || 0) + 1 : (profile.successful_trades || 0);
      const completionRate = (successfulTrades / totalTrades) * 100;

      const { data, error } = await supabase
        .from('p2p_profiles')
        .update({
          total_volume: newVolume,
          total_trades: totalTrades,
          successful_trades: successfulTrades,
          trade_completion_rate: parseFloat(completionRate.toFixed(2))
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating trading stats:', error);
      throw error;
    }
  }

  /**
   * Get trader statistics
   */
  static async getTraderStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .select('total_volume, total_trades, successful_trades, trade_completion_rate, kyc_status')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return {
        totalVolume: data.total_volume || 0,
        totalTrades: data.total_trades || 0,
        successfulTrades: data.successful_trades || 0,
        completionRate: data.trade_completion_rate || 0,
        kycStatus: data.kyc_status
      };
    } catch (error) {
      console.error('Error fetching trader statistics:', error);
      throw error;
    }
  }

  /**
   * Deactivate profile
   */
  static async deactivateProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deactivating profile:', error);
      throw error;
    }
  }

  /**
   * Activate profile
   */
  static async activateProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .update({ is_active: true })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error activating profile:', error);
      throw error;
    }
  }

  /**
   * Get top traders
   */
  static async getTopTraders(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('p2p_profiles')
        .select(`
          *,
          profiles:user_id(username, avatar_url, reputation_score)
        `)
        .eq('kyc_status', 'verified')
        .eq('is_active', true)
        .order('total_volume', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching top traders:', error);
      throw error;
    }
  }
}
