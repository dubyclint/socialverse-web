// server/utils/auth-utils.ts
// ✅ MASTER AUTHENTICATION, MIDDLEWARE & UTILITIES
// Single source of truth for ALL server operations
// Fixes all broken imports, missing packages, and plugin issues

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// ============ SUPABASE CLIENT ============
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============ AUTHENTICATION ============

/**
 * Authenticate user from Nuxt event
 */
export const authenticateUser = async (event: any) => {
  try {
    const token = 
      getCookie(event, 'auth-token') || 
      getHeader(event, 'authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      });
    }

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
 * Authenticate token (alias for compatibility)
 */
export const authenticateToken = authenticateUser;

/**
 * Auth middleware (alias for compatibility)
 */
export const authMiddleware = authenticateUser;

// ============ ROLE-BASED ACCESS CONTROL ============

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

// ============ RATE LIMITING ============

const requestMap = new Map<string, number[]>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (event: any) => {
    const ip = getClientIP(event);
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requestMap.has(ip)) {
      requestMap.set(ip, []);
    }

    const userRequests = requestMap.get(ip)!.filter(time => time > windowStart);
    
    if (userRequests.length >= maxRequests) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests. Please try again later.'
      });
    }

    userRequests.push(now);
    requestMap.set(ip, userRequests);
  };
};

/**
 * Rate limit middleware (alias for compatibility)
 */
export const rateLimitMiddleware = rateLimit;

// ============ UTILITIES ============

export const getClientIP = (event: any): string => {
  return (
    getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
    getHeader(event, 'x-real-ip') ||
    event.node.req.socket.remoteAddress ||
    'unknown'
  );
};

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

export const validateBody = (body: any, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !body[field]);
  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(', ')}`
    });
  }
};

export const handleError = (error: any, context: string = 'Operation') => {
  console.error(`${context} error:`, error);
  throw createError({
    statusCode: error.statusCode || 500,
    statusMessage: error.statusMessage || `${context} failed`
  });
};

// ============ STREAM OPERATIONS ============

export const streamOperations = {
  async createStream(userId: string, streamData: any) {
    const { data, error } = await supabase
      .from('streams')
      .insert({
        user_id: userId,
        ...streamData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStream(streamId: string) {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserStreams(userId: string) {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateStream(streamId: string, updates: any) {
    const { data, error } = await supabase
      .from('streams')
      .update(updates)
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStream(streamId: string) {
    const { error } = await supabase
      .from('streams')
      .delete()
      .eq('id', streamId);

    if (error) throw error;
    return true;
  }
};

// ============ GROUP CHAT OPERATIONS ============

export const groupChatOperations = {
  async createGroup(userId: string, groupData: any) {
    const { data, error } = await supabase
      .from('group_chats')
      .insert({
        creator_id: userId,
        ...groupData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGroup(groupId: string) {
    const { data, error } = await supabase
      .from('group_chats')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserGroups(userId: string) {
    const { data, error } = await supabase
      .from('group_chats')
      .select('*')
      .contains('members', [userId])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async addMember(groupId: string, userId: string) {
    const group = await this.getGroup(groupId);
    const members = group.members || [];
    
    if (!members.includes(userId)) {
      members.push(userId);
    }

    const { data, error } = await supabase
      .from('group_chats')
      .update({ members })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeMember(groupId: string, userId: string) {
    const group = await this.getGroup(groupId);
    const members = (group.members || []).filter((id: string) => id !== userId);

    const { data, error } = await supabase
      .from('group_chats')
      .update({ members })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============ WALLET OPERATIONS ============

export const walletOperations = {
  async lockWallet(userId: string, lockData: any) {
    const { data, error } = await supabase
      .from('wallet_locks')
      .insert({
        user_id: userId,
        ...lockData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unlockWallet(lockId: string) {
    const { data, error } = await supabase
      .from('wallet_locks')
      .update({ is_active: false, unlocked_at: new Date().toISOString() })
      .eq('id', lockId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getWalletLocks(userId: string) {
    const { data, error } = await supabase
      .from('wallet_locks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }
};

// ============ GIFT OPERATIONS ============

export const giftOperations = {
  async sendGift(senderData: any) {
    const { data, error } = await supabase
      .from('gifts')
      .insert({
        ...senderData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGifts(userId: string) {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async cancelGift(giftId: string) {
    const { data, error } = await supabase
      .from('gifts')
      .update({ status: 'cancelled' })
      .eq('id', giftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============ STATUS OPERATIONS ============

export const statusOperations = {
  async createStatus(userId: string, statusData: any) {
    const { data, error } = await supabase
      .from('statuses')
      .insert({
        user_id: userId,
        ...statusData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStatus(statusId: string) {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('id', statusId)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserStatuses(userId: string) {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteStatus(statusId: string) {
    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', statusId);

    if (error) throw error;
    return true;
  }
};

// ============ PREMIUM OPERATIONS ============

export const premiumOperations = {
  async getPricingTiers() {
    const { data, error } = await supabase
      .from('premium_tiers')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async checkFeatureAccess(userId: string, featureKey: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;

    const { data, error } = await supabase
      .from('premium_features')
      .select('*')
      .eq('tier', subscription.tier)
      .eq('feature_key', featureKey)
      .single();

    if (error) return false;
    return !!data;
  }
};

// ============ EXPORT ALL ============

export default {
  supabase,
  authenticateUser,
  authenticateToken,
  authMiddleware,
  requireAdmin,
  requireManager,
  requireRole,
  rateLimit,
  rateLimitMiddleware,
  getClientIP,
  logAdminAction,
  validateBody,
  handleError,
  streamOperations,
  groupChatOperations,
  walletOperations,
  giftOperations,
  statusOperations,
  premiumOperations
};

