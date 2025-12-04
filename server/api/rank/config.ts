import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    // Get Supabase client
    const supabase = await getSupabaseClient();
    
    const method = getMethod(event);

    if (method === 'GET') {
      const { data: ranks, error } = await supabase
        .from('rank_config')
        .select('*')
        .order('points', { ascending: true });
        
      if (error) throw error;
      return ranks || [];
    }

    if (method === 'POST') {
      const { action, rank, points } = await readBody(event);

      if (!action) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Action is required'
        });
      }

      if (action === 'add') {
        if (!rank || points === undefined) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Rank name and points are required'
          });
        }

        const { error } = await supabase
          .from('rank_config')
          .insert({ rank, points });
          
        if (error) throw error;
      } 
      else if (action === 'remove') {
        if (!rank) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Rank name is required'
          });
        }

        const { error } = await supabase
          .from('rank_config')
          .delete()
          .eq('rank', rank);
          
        if (error) throw error;
      } 
      else if (action === 'update') {
        if (!rank || points === undefined) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Rank name and points are required'
          });
        }

        const { error } = await supabase
          .from('rank_config')
          .update({ points })
          .eq('rank', rank);
          
        if (error) throw error;
      } 
      else {
        throw createError({
          statusCode: ,
          statusMessage: 'Invalid action. Must be add, remove, or update'
        });
      }

      return { success: true };
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to handle rank configuration'
    });
  }
});
