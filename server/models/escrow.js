// server/models/escrow.js - Supabase PostgreSQL Escrow Model
import { supabase } from '../utils/supabase.js';

export class Escrow {
  static async create(escrowData) {
    const { data, error } = await supabase
      .from('escrows')
      .insert([{
        trade_id: escrowData.tradeId,
        holder_id: escrowData.holderId,
        currency: escrowData.currency,
        amount: escrowData.amount,
        lock_conditions: escrowData.lockConditions,
        release_conditions: escrowData.releaseConditions
      }])
      .select(`
        *,
        trade:trade_id(*),
        holder:holder_id(username, avatar_url, reputation_score)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async lockFunds(escrowId, conditions) {
    const { data, error } = await supabase
      .from('escrows')
      .update({
        status: 'locked',
        locked_at: new Date().toISOString(),
        lock_conditions: conditions
      })
      .eq('id', escrowId)
      .select(`
        *,
        trade:trade_id(*),
        holder:holder_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async releaseFunds(escrowId, releaseData) {
    const { data, error } = await supabase
      .from('escrows')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        release_conditions: releaseData.conditions
      })
      .eq('id', escrowId)
      .select(`
        *,
        trade:trade_id(*),
        holder:holder_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async disputeEscrow(escrowId, disputeDetails) {
    const { data, error } = await supabase
      .from('escrows')
      .update({
        status: 'disputed',
        dispute_details: disputeDetails
      })
      .eq('id', escrowId)
      .select(`
        *,
        trade:trade_id(*),
        holder:holder_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getTradeEscrows(tradeId) {
    const { data, error } = await supabase
      .from('escrows')
      .select(`
        *,
        holder:holder_id(username, avatar_url, reputation_score)
      `)
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getUserEscrows(userId, status = null) {
    let query = supabase
      .from('escrows')
      .select(`
        *,
        trade:trade_id(
          *,
          seller:seller_id(username, avatar_url),
          buyer:buyer_id(username, avatar_url)
        )
      `)
      .eq('holder_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getEscrowById(id) {
    const { data, error } = await supabase
      .from('escrows')
      .select(`
        *,
        trade:trade_id(
          *,
          seller:seller_id(username, avatar_url, reputation_score),
          buyer:buyer_id(username, avatar_url, reputation_score)
        ),
        holder:holder_id(username, avatar_url, reputation_score)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingEscrows() {
    const { data, error } = await supabase
      .from('escrows')
      .select(`
        *,
        trade:trade_id(
          *,
          seller:seller_id(username, avatar_url),
          buyer:buyer_id(username, avatar_url)
        ),
        holder:holder_id(username, avatar_url)
      `)
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw error;
    return data;
  }

  static async getEscrowStatistics(holderId) {
    const { data, error } = await supabase
      .from('escrows')
      .select('status, currency, amount')
      .eq('holder_id', holderId);

    if (error) throw error;

    const stats = {
      total_escrows: data.length,
      completed: data.filter(e => e.status === 'released').length,
      disputed: data.filter(e => e.status === 'disputed').length,
      active: data.filter(e => e.status === 'locked').length,
      total_volume: {}
    };

    data.forEach(escrow => {
      if (!stats.total_volume[escrow.currency]) {
        stats.total_volume[escrow.currency] = 0;
      }
      stats.total_volume[escrow.currency] += parseFloat(escrow.amount);
    });

    return stats;
  }
}
