// controllers/escrowController.js - Escrow Controller for Supabase/PostgreSQL
import { supabase } from '../../utils/supabase';

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

      // Lock funds in buyer's wallet
      await supabase
        .from('wallets')
        .update({
          balance: parseFloat(buyerWallet.balance) - parseFloat(amount),
          locked_balance: parseFloat(buyerWallet.locked_balance || 0) + parseFloat(amount),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', buyer_id)
        .eq('currency_code', currency);

      const autoReleaseTime = auto_release_hours 
        ? new Date(Date.now() + auto_release_hours * 60 * 60 * 1000).toISOString()
        : null;

      const { data: escrow, error } = await supabase
        .from('escrows')
        .insert({
          buyer_id,
          seller_id,
          trade_id,
          amount,
          currency,
          terms,
          auto_release_at: autoReleaseTime,
          description,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Notify seller
      await supabase
        .from('notifications')
        .insert({
          user_id: seller_id,
          type: 'escrow_created',
          title: 'New Escrow Deal',
          message: 'A new escrow deal has been created for you',
          sender_id: buyer_id,
          related_id: escrow.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return res.status(201).json({
        success: true,
        message: 'Escrow deal created successfully',
        data: escrow
      });
    } catch (error) {
      console.error('Error creating escrow:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Accept escrow deal (seller)
  static async acceptEscrow(req, res) {
    try {
      const { escrowId } = req.params;
      const { user_id } = req.body;

      // Verify user is the seller
      const { data: escrow, error: fetchError } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .eq('seller_id', user_id)
        .eq('status', 'pending')
        .single();

      if (fetchError) throw fetchError;

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow deal not found or already processed' });
      }

      const { data: updatedEscrow, error } = await supabase
        .from('escrows')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single();

      if (error) throw error;

      // Notify buyer
      await supabase
        .from('notifications')
        .insert({
          user_id: escrow.buyer_id,
          type: 'escrow_accepted',
          title: 'Escrow Deal Accepted',
          message: 'Your escrow deal has been accepted',
          sender_id: user_id,
          related_id: escrowId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: 'Escrow deal accepted successfully',
        data: updatedEscrow
      });
    } catch (error) {
      console.error('Error accepting escrow:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Release escrow funds (buyer)
  static async releaseEscrow(req, res) {
    try {
      const { escrowId } = req.params;
      const { user_id, rating, review } = req.body;

      // Verify user is the buyer and escrow is active
      const { data: escrow, error: fetchError } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .eq('buyer_id', user_id)
        .eq('status', 'active')
        .single();

      if (fetchError) throw fetchError;

      if (!escrow) {
        return res.status(404).json({ error: 'Escrow deal not found or cannot be released' });
      }

      // Transfer funds from locked balance to seller
      const { data: buyerWallet } = await supabase
        .from('wallets')
        .select('locked_balance')
        .eq('user_id', escrow.buyer_id)
        .eq('currency_code', escrow.currency)
        .single();

      const { data: sellerWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', escrow.seller_id)
        .eq('currency_code', escrow.currency)
        .single();

      // Update buyer's locked balance
      await supabase
        .from('wallets')
        .update({
          locked_balance: parseFloat(buyerWallet.locked_balance) - parseFloat(escrow.amount),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', escrow.buyer_id)
        .eq('currency_code', escrow.currency);

      // Update seller's balance
      await supabase
        .from('wallets')
        .update({
          balance: parseFloat(sellerWallet.balance) + parseFloat(escrow.amount),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', escrow.seller_id)
        .eq('currency_code', escrow.currency);

      // Update escrow status
      const { data: completedEscrow, error: updateError } = await supabase
        .from('escrows')
        .update({
          status: 'completed',
          rating,
          review,
          completed_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update associated trade status
      if (escrow.trade_id) {
        await supabase
          .from('trades')
          .update({ status: 'completed' })
          .eq('id', escrow.trade_id);
      }

      // Notify seller
      await supabase
        .from('notifications')
        .insert({
          user_id: escrow.seller_id,
          type: 'escrow_released',
          title: 'Escrow Funds Released',
          message: 'Escrow funds have been released to you',
          sender_id: user_id,
          related_id: escrowId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: 'Escrow funds released successfully',
        data: completedEscrow
      });
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Cancel escrow deal
  static async cancelEscrow(req, res) {
    try {
      const { escrowId } = req.params;
      const { user_id, reason } = req.body;

      // Get escrow details
      const { data: escrow, error: fetchError } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`)
        .single();

      if (fetchError) throw fetchError;

      if (!escrow || escrow.status === 'completed') {
        return res.status(404).json({ error: 'Escrow deal not found or already completed' });
      }

      // Refund locked funds to buyer if escrow was active
      if (escrow.status === 'active' || escrow.status === 'pending') {
        const { data: buyerWallet } = await supabase
          .from('wallets')
          .select('balance, locked_balance')
          .eq('user_id', escrow.buyer_id)
          .eq('currency_code', escrow.currency)
          .single();

        await supabase
          .from('wallets')
          .update({
            balance: parseFloat(buyerWallet.balance) + parseFloat(escrow.amount),
            locked_balance: parseFloat(buyerWallet.locked_balance) - parseFloat(escrow.amount),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', escrow.buyer_id)
          .eq('currency_code', escrow.currency);
      }

      const { data: cancelledEscrow, error } = await supabase
        .from('escrows')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: user_id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single();

      if (error) throw error;

      // Notify the other party
      const otherPartyId = escrow.buyer_id === user_id ? escrow.seller_id : escrow.buyer_id;
      await supabase
        .from('notifications')
        .insert({
          user_id: otherPartyId,
          type: 'escrow_cancelled',
          title: 'Escrow Deal Cancelled',
          message: 'An escrow deal has been cancelled',
          sender_id: user_id,
          related_id: escrowId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: 'Escrow deal cancelled successfully',
        data: cancelledEscrow
      });
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Dispute escrow deal
  static async disputeEscrow(req, res) {
    try {
      const { escrowId } = req.params;
      const { user_id, dispute_reason, evidence } = req.body;

      const { data: escrow, error: fetchError } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`)
        .eq('status', 'active')
        .single();

      if (fetchError) throw fetchError;

      if (!escrow) {
        return res.status(404).json({ error: 'Active escrow deal not found' });
      }

      const { data: disputedEscrow, error } = await supabase
        .from('escrows')
        .update({
          status: 'disputed',
          dispute_reason,
          evidence,
          disputed_by: user_id,
          disputed_at: new Date().toISOString()
        })
        .eq('id', escrowId)
        .select()
        .single();

      if (error) throw error;

      // Create dispute record
      await supabase
        .from('escrow_disputes')
        .insert({
          escrow_id: escrowId,
          disputer_id: user_id,
          reason: dispute_reason,
          evidence,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: 'Escrow dispute created successfully',
        data: disputedEscrow
      });
    } catch (error) {
      console.error('Error creating escrow dispute:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user's escrow deals
  static async getUserEscrows(req, res) {
    try {
      const { userId } = req.params;
      const { role = 'all', status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('escrows')
        .select(`
          *,
          buyer:users!escrows_buyer_id_fkey(id, username, avatar_url),
          seller:users!escrows_seller_id_fkey(id, username, avatar_url),
          trade:trades!escrows_trade_id_fkey(id, trade_type, currency_from, currency_to)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (role === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else if (role === 'seller') {
        query = query.eq('seller_id', userId);
      } else {
        query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: escrows, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: escrows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching user escrows:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get escrow statistics
  static async getEscrowStats(req, res) {
    try {
      const { userId } = req.params;

      const { data: escrows, error } = await supabase
        .from('escrows')
        .select('status, amount, currency, buyer_id, seller_id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (error) throw error;

      const stats = {
        total_escrows: escrows.length,
        as_buyer: escrows.filter(e => e.buyer_id === userId).length,
        as_seller: escrows.filter(e => e.seller_id === userId).length,
        completed: escrows.filter(e => e.status === 'completed').length,
        disputed: escrows.filter(e => e.status === 'disputed').length,
        active: escrows.filter(e => e.status === 'active').length,
        total_volume: 0,
        success_rate: 0
      };

      // Calculate total volume (convert all to USDT for simplicity)
      stats.total_volume = escrows
        .filter(e => e.status === 'completed')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      // Calculate success rate
      if (stats.total_escrows > 0) {
        stats.success_rate = Math.round((stats.completed / stats.total_escrows) * 100);
      }

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching escrow stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Auto-release expired escrows (admin/cron job)
  static async autoReleaseEscrows(req, res) {
    try {
      const now = new Date().toISOString();

      // Find escrows that should be auto-released
      const { data: expiredEscrows, error: fetchError } = await supabase
        .from('escrows')
        .select('*')
        .eq('status', 'active')
        .not('auto_release_at', 'is', null)
        .lte('auto_release_at', now);

      if (fetchError) throw fetchError;

      const releasedEscrows = [];

      for (const escrow of expiredEscrows) {
        try {
          // Transfer funds to seller
          const { data: buyerWallet } = await supabase
            .from('wallets')
            .select('locked_balance')
            .eq('user_id', escrow.buyer_id)
            .eq('currency_code', escrow.currency)
            .single();

          const { data: sellerWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', escrow.seller_id)
            .eq('currency_code', escrow.currency)
            .single();

          await supabase
            .from('wallets')
            .update({
              locked_balance: parseFloat(buyerWallet.locked_balance) - parseFloat(escrow.amount)
            })
            .eq('user_id', escrow.buyer_id)
            .eq('currency_code', escrow.currency);

          await supabase
            .from('wallets')
            .update({
              balance: parseFloat(sellerWallet.balance) + parseFloat(escrow.amount)
            })
            .eq('user_id', escrow.seller_id)
            .eq('currency_code', escrow.currency);

          // Update escrow status
          await supabase
            .from('escrows')
            .update({
              status: 'auto_released',
              completed_at: new Date().toISOString()
            })
            .eq('id', escrow.id);

          releasedEscrows.push(escrow.id);

          // Notify both parties
          await supabase
            .from('notifications')
            .insert([
              {
                user_id: escrow.buyer_id,
                type: 'escrow_auto_released',
                title: 'Escrow Auto-Released',
                message: 'Your escrow has been automatically released',
                related_id: escrow.id,
                is_read: false,
                created_at: new Date().toISOString()
              },
              {
                user_id: escrow.seller_id,
                type: 'escrow_auto_released',
                title: 'Escrow Auto-Released',
                message: 'Escrow funds have been automatically released to you',
                related_id: escrow.id,
                is_read: false,
                created_at: new Date().toISOString()
              }
            ]);
        } catch (error) {
          console.error(`Error auto-releasing escrow ${escrow.id}:`, error);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Auto-released ${releasedEscrows.length} escrow deals`,
        data: { released_escrow_ids: releasedEscrows }
      });
    } catch (error) {
      console.error('Error auto-releasing escrows:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}


