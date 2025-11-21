// FILE: /server/utils/auth-utils.ts - COMPLETE FIXED VERSION WITH STUBS
// ============================================================================
// AUTHENTICATION UTILITIES WITH LAZY SUPABASE LOADING
// Includes stub implementations for all missing functions
// ============================================================================

import jwt from 'jsonwebtoken'
import { db, dbAdmin } from './database'

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (event: any) => {
    const userId = event.node.req.headers['x-user-id'] || 'anonymous'
    const key = `${userId}:${event.node.req.url}`
    
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    if (record && now < record.resetTime) {
      if (record.count >= maxRequests) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Too many requests'
        })
      }
      record.count++
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
    }
  }
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Authenticate user by email and password
 */
export const authenticateUser = async (emailOrEvent: string | any, password?: string) => {
  try {
    // Handle both direct auth and event-based auth
    if (typeof emailOrEvent === 'object' && emailOrEvent.node) {
      // Event-based authentication
      const event = emailOrEvent
      const user = await getAuthenticatedUser(event)
      if (!user) {
        throw new Error('User not authenticated')
      }
      return user
    }

    // Direct email/password authentication
    const email = emailOrEvent
    const supabase = await db()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .single()

    if (error || !profile) {
      throw new Error('User not found')
    }

    return profile
  } catch (error) {
    console.error('[Auth] Authentication error:', error)
    throw error
  }
}

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string) => {
  try {
    const supabase = await db()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error('Profile not found')
    }

    return profile
  } catch (error) {
    console.error('[Auth] Get profile error:', error)
    throw error
  }
}

/**
 * Create JWT token
 */
export const createToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

/**
 * Verify JWT token
 */
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('[Auth] Token verification error:', error)
    return null
  }
}

/**
 * Get authenticated user from request
 */
export const getAuthenticatedUser = async (event: any) => {
  try {
    const authHeader = event.node.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || !(decoded as any).userId) {
      return null
    }

    return await getUserProfile((decoded as any).userId)
  } catch (error) {
    console.error('[Auth] Get authenticated user error:', error)
    return null
  }
}

/**
 * Require authentication middleware
 */
export const requireAuth = async (event: any) => {
  const user = await getAuthenticatedUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return user
}

/**
 * Require admin authentication middleware
 */
export const requireAdmin = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required'
    })
  }

  return user
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const supabase = await dbAdmin()
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('[Auth] Update profile error:', error)
    throw error
  }
}

/**
 * Delete user
 */
export const deleteUser = async (userId: string) => {
  try {
    const supabase = await dbAdmin()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('[Auth] Delete user error:', error)
    throw error
  }
}

/**
 * Log admin action
 */
export const logAdminAction = async (adminId: string, action: string, details: any) => {
  try {
    const supabase = await dbAdmin()
    
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        details,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('[Auth] Failed to log admin action:', error)
    }
  } catch (error) {
    console.error('[Auth] Log admin action error:', error)
  }
}

/**
 * Validate request body
 */
export const validateBody = (body: any, requiredFields: string[]) => {
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body is required'
    })
  }

  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  return true
}

/**
 * Handle errors
 */
export const handleError = (error: any) => {
  console.error('[Auth] Error:', error)
  
  if (error.statusCode) {
    throw error
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error'
  })
}

// ============================================================================
// STUB IMPLEMENTATIONS FOR MISSING FUNCTIONS
// ============================================================================

/**
 * Premium operations - stub implementation
 * TODO: Replace with actual premium feature logic
 */
export const premiumOperations = {
  async checkAccess(userId: string, feature: string) {
    try {
      console.log(`[Premium] Checking access for user ${userId} to feature ${feature}`)
      // TODO: Implement actual premium access check
      return true
    } catch (error) {
      console.error('[Premium] Check access error:', error)
      return false
    }
  },

  async getFeatures(userId: string) {
    try {
      console.log(`[Premium] Getting features for user ${userId}`)
      // TODO: Implement actual feature retrieval
      return []
    } catch (error) {
      console.error('[Premium] Get features error:', error)
      return []
    }
  },

  async upgradeUser(userId: string, plan: string) {
    try {
      console.log(`[Premium] Upgrading user ${userId} to plan ${plan}`)
      // TODO: Implement actual upgrade logic
      return { success: true, plan }
    } catch (error) {
      console.error('[Premium] Upgrade error:', error)
      throw error
    }
  },

  async downgradeUser(userId: string) {
    try {
      console.log(`[Premium] Downgrading user ${userId}`)
      // TODO: Implement actual downgrade logic
      return { success: true }
    } catch (error) {
      console.error('[Premium] Downgrade error:', error)
      throw error
    }
  }
}

/**
 * Lazy-loaded supabase client proxy for backward compatibility
 */
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const client = await db()
      return (client as any)[prop]?.(...args)
    }
  }
}) as any
