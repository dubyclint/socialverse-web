// server/api/posts/index.get.js
// ✅ FIXED - Uses master auth-utils and has proper controller
import { authenticateUser, supabase } from '../../utils/auth-utils.ts';

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event);
    const query = getQuery(event);
    
    const page = parseInt(query.page as string || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      success: true,
      data: data,
      pagination: {
        page,
        limit,
        total: count
      }
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch posts'
    });
  }
});
