// server/api/wallet-lock/index.post.ts
import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseClient();
    const user = event.context.user;
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      });
    }

    const body = await readBody(event);
    const { action } = body;

    if (!action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Action is required'
      });
    }

    let result;

    if (action === 'lock') {
      // Lock wallet funds
      if (!body.amount) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Amount is required for lock action'
        });
      }

      const lockData = {
        id: crypto.randomUUID(),
        user_id: user.id,
        amount: body.amount,
        reason: body.reason || 'Manual lock',
        locked_at: new Date().toISOString(),
        expires_at: body.expires_at || null,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('wallet_locks')
        .insert(lockData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } 
    else if (action === 'unlock') {
      // Unlock wallet funds
      if (!body.lock_id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Lock ID is required for unlock action'
        });
      }

      const { error } = await supabase
        .from('wallet_locks')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', body.lock_id)
        .eq('user_id', user.id);

      if (error) throw error;
      result = { success: true, lock_id: body.lock_id };
    } 
    else if (action === 'get_locks') {
      // Get all wallet locks for user
      const { data, error } = await supabase
        .from('wallet_locks')
        .select('*')
        .eq('user_id', user.id)
        .order('locked_at', { ascending: false });

      if (error) throw error;
      result = data || [];
    } 
    else {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown action: ${action}`
      });
    }

    return {
      success: true,
      message: `Wallet lock ${action} successful`,
      data: result
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Wallet lock operation failed'
    });
  }
});
