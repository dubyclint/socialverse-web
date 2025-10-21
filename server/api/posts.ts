// server/api/posts.ts
// ✅ FIXED - Uses master auth-utils
import { authenticateUser, supabase } from '~/server/utils/auth-utils';

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch posts'
    });
  }
});
