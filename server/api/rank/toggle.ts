import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    // Initialize Supabase client
    const supabase = await getSupabaseClient();
    
    const { userId } = await readBody(event);

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      });
    }

    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('can_toggle_rank, rank_toggle_expires, hide_rank')
      .eq('id', userId)
      .single();
      
    if (fetchError) throw fetchError;

    // Check if user can toggle rank
    if (!user.can_toggle_rank) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Rank toggle not allowed for this user'
      });
    }

    // Check if toggle permission has expired
    if (user.rank_toggle_expires && Date.now() > new Date(user.rank_toggle_expires).getTime()) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Toggle permission has expired'
      });
    }

    const newStatus = !user.hide_rank;

    // Update user's rank visibility
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        hide_rank: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (updateError) throw updateError;

    return { hideRank: newStatus };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle rank visibility'
    });
  }
});
