// server/api/posts/index.get.ts
import { authenticateUser, supabase } from '../../utils/auth-utils';
import { defineEventHandler, getQuery, createError } from 'h3';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  // Add other post fields as needed based on your Supabase schema
}

interface Pagination {
  page: number;
  limit: number;
  total: number | null;
}

interface ApiResponse {
  success: true;
  data: Post[];
  pagination: Pagination;
}

export default defineEventHandler(async (event) => {
  try {
    const user = await authenticateUser(event);
    const query = getQuery(event);
    
    const page = parseInt(query.page as string || '1', 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const response: ApiResponse = {
      success: true,
      data: data as Post[],
      pagination: {
        page,
        limit,
        total: count
      }
    };

    return response;
  } catch (error: unknown) {
    // Type guard for error handling
    const err = error as { statusCode?: number; statusMessage?: string };
    
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to fetch posts'
    });
  }
});
