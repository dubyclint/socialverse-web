import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const ad = await readBody(event);
    
    const adData = {
      ...ad,
      status: 'pending',
      created_at: new Date().toISOString(),
      owner_id: event.context.user.id
    };

    const { error } = await supabase
      .from('ads')
      .insert(adData);
      
    if (error) throw error;

    return { success: true };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit ad'
    });
  }
});

