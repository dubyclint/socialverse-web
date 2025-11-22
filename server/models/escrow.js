// server/models/escrow.js - Supabase PostgreSQL Escrow Model
import { supabase } from '../utils/supabase.js';

export class Escrow {
  /**
   * Create a new escrow
   */
  static async create(escrowData) {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .insert([{
          trade_id: escrowData.tradeId,
          holder_id: escrowData.holderId,
          currency: escrowData.currency,
          amount: escrowData.amount,
          lock_conditions: escrowData.lockConditions,
          release_conditions: escrowData.releaseConditions,
          status: 'pending'
        }])
        .select(`
          *,
          trade:trade_id(*),
          holder:holder_id(username, avatar_url, reputation_score)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Lock funds in escrow
   */
  static async lockFunds(escrowId, conditions) {
    try {
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
    } catch (error) {
      console.error('Error locking funds:', error);
      throw error;
    }
  }

  /**
   * Release funds from escrow
   */
  static async releaseFunds(escrowId, releaseData) {
    try {
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
    } catch (error) {
      console.error('Error releasing funds:', error);
      throw error;
    }
  }

  /**
   * Dispute escrow
   */
  static async disputeEscrow(escrowId, disputeDetails) {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .update({
          status: 'disputed',
          dispute_details: disputeDetails,
          disputed_at: new Date().toISOString()
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
    } catch (error) {
      console.error('Error disputing escrow:', error);
      throw error;
    }
  }

  /**
   * Get escrows for trade
   */
  static async getTradeEscrows(tradeId) {
    try {
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
    } catch (error) {
      console.error('Error fetching trade escrows:', error);
      throw error;
    }
  }

  /**
   * Get user escrows
   */
  static async getUserEscrows(userId, status = null) {
    try {
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
    } catch (error) {
      console.error('Error fetching user escrows:', error);
      throw error;
    }
  }

  /**
   * Get escrow by ID
   */
  static async getById(id) {
    try {
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
    } catch (error) {
      console.error('Error fetching escrow:', error);
      throw error;
    }
  }

  /**
   * Get pending escrows
   */
  static async getPendingEscrows() {
    try {
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
    } catch (error) {
      console.error('Error fetching pending escrows:', error);
      throw error;
    }
  }

  /**
   * Get escrow statistics
   */
  static async getStatistics(holderId) {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .select('status, currency, amount');

      if (error) throw error;

      const stats = {
        totalEscrows: data.length,
        completed: data.filter(e => e.status === 'released').length,
        disputed: data.filter(e => e.status === 'disputed').length,
        active: data.filter(e => e.status === 'locked').length,
        pending: data.filter(e => e.status === 'pending').length,
        totalVolume: {}
      };

      data.forEach(escrow => {
        if (!stats.totalVolume[escrow.currency]) {
          stats.totalVolume[escrow.currency] = 0;
        }
        stats.totalVolume[escrow.currency] += parseFloat(escrow.amount || 0);
      });

      return stats;
    } catch (error) {
      console.error('Error fetching escrow statistics:', error);
      throw error;
    }
  }

  /**
   * Refund escrow
   */
  static async refund(escrowId, refundReason) {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: refundReason
        })
        .eq('id', escrowId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error refunding escrow:', error);
      throw error;
    }
  }

  /**
   * Resolve dispute
   */
  static async resolveDispute(escrowId, resolution) {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .update({
          status: resolution === 'release' ? 'released' : 'refunded',
          dispute_resolved_at: new Date().toISOString(),
          dispute_resolution: resolution
        })
        .eq('id', escrowId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }

  /**
   * Get escrow history
   */
  static async getHistory(escrowId) {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching escrow history:', error);
      throw error;
    }
  }
}
