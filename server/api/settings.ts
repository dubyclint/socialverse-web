import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  // Initialize Supabase client
  const supabase = await getSupabaseClient();
  
  const method = getMethod(event);
  
  if (method === 'GET') {
    const query = getQuery(event);
    const scope = query.scope as string;
    
    if (!scope) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing scope parameter'
      });
    }

    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('scope', scope);
        
      if (error) throw error;
      return settings;
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to load settings'
      });
    }
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    const { scope, key, value } = body;
    
    if (!scope || !key) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing scope or key'
      });
    }

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ scope, key, value });
        
      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save setting'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});

