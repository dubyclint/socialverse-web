import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    // Get Supabase client
    const supabase = await getSupabaseClient();
    
    const query = getQuery(event);
    const userId = query.userId || event.context.user?.id;

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      });
    }

    // Get user's current rank
    const { data: user, error } = await supabase
      .from('users')
      .select('rank, rank_points, rank_level')
      .eq('id', userId)
      .single();
      
    if (error) throw error;

    return {
      rank: user.rank || 'Homie',
      points: user.rank_points || 0,
      level: user.rank_level || 1
    };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user rank'
    });
  }
});


