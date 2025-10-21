// server/utils/auth-utils.ts
// ✅ MASTER AUTHENTICATION & MIDDLEWARE UTILITY
// This is the single source of truth for all auth operations
// Import this in any file that needs authentication

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Authenticate user from Nuxt event
 * Works with both Nuxt handlers and Express-like middleware
 */
export const authenticateUser = async (event: any) => {
  try {
    // Get token from cookie or header
    const token = 
      getCookie(event, 'auth-token') || 
      getHeader(event, 'authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      });
    }

    // Attach user to event context
    event.context.user = user;
    return user;
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw createError({
      statusCode: error.statusCode || 401,
      statusMessage: error.statusMessage || 'Authentication failed'
    });
  }
};

/**
 * Check if user has admin role
 */
export const requireAdmin = async (event: any) => {
  const user = await authenticateUser(event);
  
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    });
  }
  
  return user;
};

/**
 * Check if user has manager role
 */
export const requireManager = async (event: any) => {
  const user = await authenticateUser(event);
  
  if (user.role !== 'manager' && user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Manager access required'
    });
  }
  
  return user;
};

/**
 * Check if user has specific role
 */
export const requireRole = (role: string) => {
  return async (event: any) => {
    const user = await authenticateUser(event);
    
    if (user.role !== role) {
      throw createError({
        statusCode: 403,
        statusMessage: `${role} access required`
      });
    }
    
    return user;
  };
};

/**
 * Rate limiting middleware
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return async (event: any) => {
    const ip = getClientIP(event);
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip)!.filter(time => time > windowStart);
    
    if (userRequests.length >= maxRequests) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests. Please try again later.'
      });
    }

    userRequests.push(now);
    requests.set(ip, userRequests);
  };
};

/**
 * Get client IP address
 */
export const getClientIP = (event: any): string => {
  return (
    getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
    getHeader(event, 'x-real-ip') ||
    event.node.req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Log admin action
 */
export const logAdminAction = async (
  adminId: string,
  actionType: string,
  targetId: string,
  targetType: string,
  details?: any
) => {
  try {
    await supabase.from('admin_actions').insert({
      admin_id: adminId,
      action_type: actionType,
      target_id: targetId,
      target_type: targetType,
      details: details || {},
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

/**
 * Validate request body
 */
export const validateBody = (body: any, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !body[field]);
  
  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(', ')}`
    });
  }
};

/**
 * Handle errors consistently
 */
export const handleError = (error: any, context: string = 'Operation') => {
  console.error(`${context} error:`, error);
  
  throw createError({
    statusCode: error.statusCode || 500,
    statusMessage: error.statusMessage || `${context} failed`
  });
};

export default {
  supabase,
  authenticateUser,
  requireAdmin,
  requireManager,
  requireRole,
  rateLimit,
  getClientIP,
  logAdminAction,
  validateBody,
  handleError
};
