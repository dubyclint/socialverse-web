// server/controllers/adminController.js
// ✅ FIXED - Now uses master auth-utils
import { supabase, logAdminAction } from '../utils/auth-utils.ts';

export class AdminController {
  static async getDashboardStats(req, res) {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async banUser(req, res) {
    try {
      const { user_id, reason } = req.body;
      const admin_id = req.user.id;

      const { data, error } = await supabase
        .from('users')
        .update({ is_banned: true, ban_reason: reason })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      await logAdminAction(admin_id, 'user_ban', user_id, 'user', { reason });
      
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error banning user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async verifyUser(req, res) {
    try {
      const { user_id } = req.body;
      const admin_id = req.user.id;

      const { data, error } = await supabase
        .from('users')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      await logAdminAction(admin_id, 'user_verify', user_id, 'user');
      
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error verifying user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async adjustUserBalance(req, res) {
    try {
      const { user_id, amount, action, reason } = req.body;
      const admin_id = req.user.id;

      const { data: adjustment, error: adjustmentError } = await supabase
        .from('balance_adjustments')
        .insert({
          user_id,
          amount,
          action,
          reason,
          admin_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (adjustmentError) throw adjustmentError;

      const adjustmentAmount = action === 'add' ? amount : action === 'subtract' ? -amount : amount;
      const { error: balanceError } = await supabase.rpc('adjust_user_balance', {
        user_id,
        adjustment: adjustmentAmount,
        set_balance: action === 'set'
      });

      if (balanceError) throw balanceError;
      await logAdminAction(admin_id, 'balance_adjustment', user_id, 'user', { amount, action, reason });
      
      return res.status(200).json({ success: true, data: adjustment });
    } catch (error) {
      console.error('Error adjusting balance:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async assignManager(req, res) {
    try {
      const { user_id } = req.body;
      const admin_id = req.user.id;

      const { data, error } = await supabase
        .from('users')
        .update({ role: 'manager', assigned_by: admin_id })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      await logAdminAction(admin_id, 'manager_assignment', user_id, 'user');
      
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error assigning manager:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFlaggedContent(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const { data, error, count } = await supabase
        .from('flagged_content')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return res.status(200).json({ success: true, data, total: count });
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAdminActivity(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const { data, error, count } = await supabase
        .from('admin_actions')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return res.status(200).json({ success: true, data, total: count });
    } catch (error) {
      console.error('Error fetching admin activity:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

