// server/api/controllers/tradeController.js
import { supabase } from '../../utils/supabase.js';

export class TradeController {
  // Create new trade
  static async createTrade(req, res) {
    try {
      const {
        user_id,
        trade_type,
        currency_from,
        currency_to,
        amount_from,
        amount_to,
        exchange_rate,
        description,
        payment_methods,
        min_amount,
        max_amount
      } = req.body;

      const { data: trade, error } = await supabase
        .from('trades')
        .insert({
          user_id,
          trade_type,
          currency_from,
          currency_to,
          amount_from,
          amount_to,
          exchange_rate,
          description,
          payment_methods,
          min_amount,
          max_amount,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Trade created successfully',
        data: trade
      });
    } catch (error) {
      console.error('Error creating trade:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all active trades
  static async getActiveTrades(req, res) {
    try {
      const { page = 1, limit = 10, currency_from, currency_to, trade_type } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('trades')
        .select(`
          *,
          users!trades_user_id_fkey(id, username, avatar_url, reputation_score)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (currency_from) query = query.eq('currency_from', currency_from);
      if (currency_to) query = query.eq('currency_to', currency_to);
      if (trade_type) query = query.eq('trade_type', trade_type);

      const { data: trades, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: trades,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching active trades:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user trades
  static async getUserTrades(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: trades, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: trades
      });
    } catch (error) {
      console.error('Error fetching user trades:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update trade status
  static async updateTradeStatus(req, res) {
    try {
      const { tradeId } = req.params;
      const { status, buyer_id } = req.body;

      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (buyer_id) updateData.buyer_id = buyer_id;
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { data: trade, error } = await supabase
        .from('trades')
        .update(updateData)
        .eq('id', tradeId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Trade status updated successfully',
        data: trade
      });
    } catch (error) {
      console.error('Error updating trade status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Accept trade offer
  static async acceptTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { buyer_id, amount } = req.body;

      // Verify trade is still active
      const { data: trade, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .eq('status', 'active')
        .single();

      if (fetchError) throw fetchError;

      if (!trade) {
        return res.status(404).json({ error: 'Trade not found or no longer active' });
      }

      // Update trade status to in_progress
      const { data: updatedTrade, error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'in_progress',
          buyer_id: buyer_id,
          actual_amount: amount,
          accepted_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        message: 'Trade accepted successfully',
        data: updatedTrade
      });
    } catch (error) {
      console.error('Error accepting trade:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete trade
  static async deleteTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { userId } = req.body;

      // Verify ownership
      const { data: trade, error: fetchError } = await supabase
        .from('trades')
        .select('user_id, status')
        .eq('id', tradeId)
        .single();

      if (fetchError) throw fetchError;

      if (trade.user_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to delete this trade' });
      }

      if (trade.status === 'in_progress') {
        return res.status(400).json({ error: 'Cannot delete trade in progress' });
      }

      const { error: deleteError } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        success: true,
        message: 'Trade deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting trade:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get trade by ID
  static async getTradeById(req, res) {
    try {
      const { tradeId } = req.params;

      const { data: trade, error } = await supabase
        .from('trades')
        .select(`
          *,
          seller:users!trades_user_id_fkey(id, username, avatar_url, reputation_score),
          buyer:users!trades_buyer_id_fkey(id, username, avatar_url, reputation_score)
        `)
        .eq('id', tradeId)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: trade
      });
    } catch (error) {
      console.error('Error fetching trade:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
