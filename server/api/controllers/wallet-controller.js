// controllers/escrowController.js - Escrow Controller for Supabase/PostgreSQL
import { supabase } from '~/server/utils/database';

export class EscrowController {
  // Create escrow deal
  static async createEscrow(req, res) {
    try {
      const {
        buyer_id,
        seller_id,
        trade_id,
        amount,
        currency,
        terms,
        auto_release_hours,
        description
      } = req.body;

      if (buyer_id === seller_id) {
        return res.status(400).json({ error: 'Buyer and seller cannot be the same user' });
      }

      // Verify buyer has sufficient balance
      const { data: buyerWallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', buyer_id)
        .eq('currency_code', currency)
        .single();

      if (walletError) throw walletError;

      if (parseFloat(buyerWallet.balance) < parseFloat(amount)) {
        return res.status(400).json({ error: 'Insufficient balance to create escrow' });
      }

      // Create escrow record
      const { data: escrow, error } = await supabase
        .from('escrow_deals')
        .insert({
          buyer_id,
          seller_id,
          trade_id,
          amount,
          currency,
          terms,
          auto_release_hours,
          description,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Escrow deal created successfully',
        data: escrow
      });
    } catch (error) {
      console.error('Error creating escrow:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Release escrow funds
  static async releaseEscrow(req, res) {
    try {
      const { escrow_id } = req.body;

      const { data: escrow, error: fetchError } = await supabase
        .from('escrow_deals')
        .select('*')
        .eq('id', escrow_id)
        .single();

      if (fetchError) throw fetchError;

      // Update escrow status
      const { data: updated, error } = await supabase
        .from('escrow_deals')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('id', escrow_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Escrow funds released successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
