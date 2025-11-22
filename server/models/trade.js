// server/models/trade.js - Supabase PostgreSQL Trading Model
import { supabase } from '../utils/supabase.js';

export class Trade {
  static async create(tradeData) {
    const { data, error } = await supabase 
      .from('trades')
      .insert([{
        seller_id: tradeData.sellerId,
        buyer_id: tradeData.buyerId,
        currency_sell: tradeData.currencySell,
        currency_buy: tradeData.currencyBuy,
        amount: tradeData.amount,
        price: tradeData.price,
        total_value: tradeData.amount * tradeData.price,
        payment_method: tradeData.paymentMethod,
        trade_type: tradeData.tradeType,
        notes: tradeData.notes,
        terms: tradeData.terms,
        expires_at: tradeData.expiresAt
      }])
      .select(`
        *,
        seller:seller_id(username, avatar_url),
        buyer:buyer_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        seller:seller_id(username, avatar_url, reputation_score),
        buyer:buyer_id(username, avatar_url, reputation_score),
        escrows(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserTrades(userId) {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        seller:seller_id(username, avatar_url),
        buyer:buyer_id(username, avatar_url)
      `)
      .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('trades')
      .update({ 
        status,
        ...(status === 'completed' && { completed_at: new Date().toISOString() })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getActiveListings(filters = {}) {
    let query = supabase
      .from('trades')
      .select(`
        *,
        seller:seller_id(username, avatar_url, reputation_score)
      `)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (filters.currency) {
      query = query.eq('currency_sell', filters.currency);
    }
    if (filters.minAmount) {
      query = query.gte('amount', filters.minAmount);
    }
    if (filters.maxAmount) {
      query = query.lte('amount', filters.maxAmount);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
