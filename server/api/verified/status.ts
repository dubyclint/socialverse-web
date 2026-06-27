import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseClient();
    const query = getQuery(event);
    const userId = query.userId || event.context.user.id;
    const pending = query.pending === 'true';

    if (pending) {
      // Return all pending requests (admin functionality)
      const { data: requests, error } = await supabase
        .from('badge_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return requests || [];
    }

    // Return user's specific request status
    const { data: request, error } = await supabase
      .from('badge_requests')
      .select('status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return { 
      status: request?.status || 'none',
      createdAt: request?.created_at,
      updatedAt: request?.updated_at
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch verification status'
    });
  }
});
