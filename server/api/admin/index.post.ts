// server/api/admin/index.post.ts
// ✅ FIXED - Single unified admin handler
import { 
  requireAdmin, 
  supabase, 
  logAdminAction, 
  validateBody, 
  handleError 
} from '../../utils/auth-utils';

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event);
    const body = await readBody(event);
    const { action, user_id, amount, reason } = body;

    validateBody(body, ['action']);

    let result;

    // ========== USER MANAGEMENT ==========
    if (action === 'ban_user') {
      validateBody(body, ['user_id']);
      
      const { data, error } = await supabase
        .from('users')
        .update({ is_banned: true, ban_reason: reason })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      
      await logAdminAction(admin.id, 'user_ban', user_id, 'user', { reason });
    }
    
    else if (action === 'verify_user') {
      validateBody(body, ['user_id']);
      
      const { data, error } = await supabase
        .from('users')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      
      await logAdminAction(admin.id, 'user_verify', user_id, 'user');
    }

    // ========== BALANCE MANAGEMENT ==========
    else if (action === 'adjust_balance') {
      validateBody(body, ['user_id', 'amount']);
      
      if (!['add', 'subtract', 'set'].includes(body.action_type || 'add')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action_type. Use: add, subtract, set'
        });
      }

      const { data: adjustment, error: adjustmentError } = await supabase
        .from('balance_adjustments')
        .insert({
          user_id,
          amount,
          action: body.action_type || 'add',
          reason,
          admin_id: admin.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (adjustmentError) throw adjustmentError;

      const adjustmentAmount = 
        (body.action_type || 'add') === 'add' ? amount : 
        (body.action_type || 'add') === 'subtract' ? -amount : 
        amount;

      const { error: balanceError } = await supabase.rpc('adjust_user_balance', {
        user_id,
        adjustment: adjustmentAmount,
        set_balance: (body.action_type || 'add') === 'set'
      });

      if (balanceError) throw balanceError;
      result = adjustment;
      
      await logAdminAction(admin.id, 'balance_adjustment', user_id, 'user', { amount, action: body.action_type });
    }

    // ========== MANAGER ASSIGNMENT ==========
    else if (action === 'assign_manager') {
      validateBody(body, ['user_id']);
      
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'manager', assigned_by: admin.id })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      
      await logAdminAction(admin.id, 'manager_assignment', user_id, 'user');
    }

    // ========== CONTENT MODERATION ==========
    else if (action === 'flag_content') {
      validateBody(body, ['content_id', 'content_type']);
      
      const { data, error } = await supabase
        .from('flagged_content')
        .insert({
          content_id: body.content_id,
          content_type: body.content_type,
          reason: reason,
          flagged_by: admin.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
      
      await logAdminAction(admin.id, 'content_flag', body.content_id, body.content_type, { reason });
    }

    // ========== DASHBOARD STATS ==========
    else if (action === 'get_stats') {
      const { data, error } = await supabase.rpc('get_admin_stats');
      
      if (error) throw error;
      result = data;
    }

    // ========== ACTIVITY LOG ==========
    else if (action === 'get_activity') {
      const query = getQuery(event);
      const limit = parseInt(query.limit as string) || 50;
      const offset = parseInt(query.offset as string) || 0;

      const { data, error, count } = await supabase
        .from('admin_actions')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      result = {
        data,
        total: count,
        limit,
        offset
      };
    }

    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Action '${action}' completed successfully`,
      data: result
    };

  } catch (error: any) {
    return handleError(error, 'Admin operation');
  }
});
