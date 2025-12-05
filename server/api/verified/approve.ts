import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseClient();
    const { id, approve } = await readBody(event);
    const status = approve ? 'approved' : 'rejected';

    if (!id || approve === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: id and approve'
      });
    }

    // Update badge request status
    const { error: updateError } = await supabase
      .from('badge_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (updateError) throw updateError;

    if (approve) {
      // Get the request to find user ID
      const { data: request, error: fetchError } = await supabase
        .from('badge_requests')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;

      // Update user verification status
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', request.user_id);
        
      if (userUpdateError) throw userUpdateError;
    }

    return { success: true, status };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update verification request'
    });
  }
});
