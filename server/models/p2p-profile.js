// server/models/p2p-profile.js - Supabase PostgreSQL P2P Profile Model
import { supabase } from '../utils/supabase.js';

export class P2PProfile {
  static async create(profileData) {
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
        kyc_status: 'pending'
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url, reputation_score)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByUserId(userId) {
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
  }

  static async updateProfile(userId, updateData) {
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
  }

  static async updateKYCStatus(userId, status, documents = null) {
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
  }

  static async getVerifiedTraders(limit = 20) {
    const { data, error } = await supabase
      .from('p2p_profiles')
      .select(`
        *,
        profiles:user_id(username, avatar_url, reputation_score, total_trades, successful_trades)
      `)
      .eq('kyc_status', 'verified')
      .eq('is_active', true)
      .order('total_volume', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async searchTraders(filters = {}) {
    let query = supabase
      .from('p2p_profiles')
      .select(`
        *,
        profiles:user_id(username, avatar_url, reputation_score, total_trades, successful_trades)
      `)
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

    query = query.order('total_volume', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async updateTradingStats(userId, volumeIncrease, isSuccessful = true) {
    const { data: profile } = await this.getByUserId(userId);
    
    const newVolume = (profile.total_volume || 0) + volumeIncrease;
    const completionRate = isSuccessful 
      ? ((profile.successful_trades + 1) / (profile.total_trades + 1)) * 100
      : (profile.successful_trades / (profile.total_trades + 1)) * 100;

    const { data, error } = await supabase
      .from('p2p_profiles')
      .update({
        total_volume: newVolume,
        trade_completion_rate: completionRate.toFixed(2)
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
