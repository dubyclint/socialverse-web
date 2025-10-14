// controllers/adminController.js
import { supabase } from '../utils/supabase.js';

export class AdminController {
  // Get admin dashboard stats
  static async getDashboardStats(req, res) {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Adjust user balance
  static async adjustUserBalance(req, res) {
    try {
      const { user_id, amount, action, reason } = req.body;
      const admin_id = req.user.id; // From auth middleware

      // Record the adjustment
      const { data: adjustment, error: adjustmentError } = await supabase
        .from('balance_adjustments')
        .insert({
          user_id,
          amount,
          action,
          reason,
          admin_id
        })
        .select()
        .single();

      if (adjustmentError) throw adjustmentError;

      // Apply the balance change
      const { error: balanceError } = await supabase.rpc('adjust_user_balance', {
        user_id,
        adjustment: action === 'add' ? amount : action === 'subtract' ? -amount : amount,
        set_balance: action === 'set'
      });

      if (balanceError) throw balanceError;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id,
        action_type: 'balance_adjustment',
        target_id: user_id,
        target_type: 'user',
        details: { amount, action, reason }
      });

      return res.status(200).json({
        success: true,
        message: 'Balance adjusted successfully',
        data: adjustment
      });
    } catch (error) {
      console.error('Error adjusting balance:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Assign manager role
  static async assignManager(req, res) {
    try {
      const { user_id, role, permissions } = req.body;
      const admin_id = req.user.id;

      const { data: manager, error } = await supabase
        .from('user_roles')
        .insert({
          user_id,
          role,
          permissions,
          assigned_by: admin_id
        })
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id,
        action_type: 'manager_assignment',
        target_id: user_id,
        target_type: 'user',
        details: { role, permissions }
      });

      return res.status(201).json({
        success: true,
        message: 'Manager assigned successfully',
        data: manager
      });
    } catch (error) {
      console.error('Error assigning manager:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get flagged content
  static async getFlaggedContent(req, res) {
    try {
      const { data: reports, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          reporter:reporter_id(username, avatar_url),
          reviewer:reviewed_by(username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('Error fetching flagged content:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Ban user
  static async banUser(req, res) {
    try {
      const { user_id, reason, duration } = req.body;
      const admin_id = req.user.id;

      // Update user status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: 'banned',
          ban_reason: reason,
          ban_expires_at: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
        })
        .eq('id', user_id);

      if (updateError) throw updateError;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id,
        action_type: 'user_ban',
        target_id: user_id,
        target_type: 'user',
        details: { reason, duration }
      });

      return res.status(200).json({
        success: true,
        message: 'User banned successfully'
      });
    } catch (error) {
      console.error('Error banning user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify user
  static async verifyUser(req, res) {
    try {
      const { user_id } = req.body;
      const admin_id = req.user.id;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ verified: true })
        .eq('id', user_id);

      if (updateError) throw updateError;

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id,
        action_type: 'user_verification',
        target_id: user_id,
        target_type: 'user',
        details: {}
      });

      return res.status(200).json({
        success: true,
        message: 'User verified successfully'
      });
    } catch (error) {
      console.error('Error verifying user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get admin activity log
  static async getAdminActivity(req, res) {
    try {
      const { data: activities, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:admin_id(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Error fetching admin activity:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
