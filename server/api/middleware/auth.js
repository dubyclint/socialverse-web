// server/api/middleware/auth.js
import jwt from 'jsonwebtoken';
import { supabase } from '../../../utils/supabase.ts';

export const authenticateUser = async (event) => {
  const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      });
    }

    event.context.user = user;
    return user;
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication failed'
    });
  }
};

export const authMiddleware = authenticateUser;
export default authenticateUser;
