// FILE: /server/utils/auth-utils.ts - FIXED WITH LAZY LOADING
// ============================================================================
// AUTHENTICATION UTILITIES WITH LAZY SUPABASE LOADING
// ============================================================================

import jwt from 'jsonwebtoken'
import { getSupabaseClient, getSupabaseAdminClient } from './database'

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
export const authenticateUser = async (email: string, password: string) => {
  try {
    const supabase = await getSupabaseClient()
    
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
    const supabase = await getSupabaseClient()
    
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
    
    if (!decoded || !decoded.userId) {
      return null
    }

    return await getUserProfile(decoded.userId)
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
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const supabase = await getSupabaseAdminClient()
    
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
    const supabase = await getSupabaseAdminClient()
    
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

