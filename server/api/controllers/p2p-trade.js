// server/api/controllers/tradeController.js
import { supabase } from '~/server/utils/database';

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
      return res.status(500).json({ error: error.message });
    }
  }

  // Get trades
  static async getTrades(req, res) {
    try {
      const { user_id, trade_type, status } = req.query;

      let query = supabase
        .from('trades')
        .select('*');

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      if (trade_type) {
        query = query.eq('trade_type', trade_type);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching trades:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Update trade status
  static async updateTradeStatus(req, res) {
    try {
      const { trade_id, status } = req.body;

      const { data, error } = await supabase
        .from('trades')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', trade_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Trade status updated successfully',
        data
      });
    } catch (error) {
      console.error('Error updating trade status:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
