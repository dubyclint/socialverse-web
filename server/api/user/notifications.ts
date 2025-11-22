import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });
      
    if (error) throw error;

    return notifications || [];
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notifications'
    });
  }
});
