// server/utils/auth-utils.ts
// ✅ MASTER AUTHENTICATION, MIDDLEWARE & UTILITIES
// Single source of truth for ALL server operations
// Fixes all broken imports, missing packages, and plugin issues

import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

// ============ SUPABASE CLIENT ============
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

// ✅ CRITICAL FIX: Validate Supabase credentials on startup
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL ERROR: Supabase credentials not configured!')
  console.error('Missing environment variables:')
  if (!supabaseUrl) console.error('  - SUPABASE_URL')
  if (!supabaseKey) console.error('  - SUPABASE_KEY')
  console.error('Please check your .env file and restart the server.')
  // Don't throw here, let it fail gracefully on first request
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============ AUTHENTICATION ============

/**
 * Authenticate user from Nuxt event
 */
export const authenticateUser = async (event: any) => {
  try {
    const token = 
      getCookie(event, 'auth-token') || 
      getHeader(event, 'authorization')?.replace('Bearer ', '')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.error('[Auth] Invalid or expired token:', error)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    }

    event.context.user = user
    return user
  } catch (error: any) {
    console.error('[Auth] Authentication error:', error)
    throw createError({
      statusCode: error.statusCode || 401,
      statusMessage: error.statusMessage || 'Authentication failed'
    })
  }
}

/**
 * Authenticate token (alias for compatibility)
 */
export const authenticateToken = authenticateUser

/**
 * Auth middleware (alias for compatibility)
 */
export const authMiddleware = authenticateUser

// ============ ROLE-BASED ACCESS CONTROL ============

export const requireAdmin = async (event: any) => {
  const user = await authenticateUser(event)
  
  // Fetch user profile to check role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('[Auth] Failed to fetch user profile:', error)
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied'
    })
  }

  if (profile.role !== 'admin') {
    console.error('[Auth] User is not admin:', user.id)
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  return user
}

export const requireManager = async (event: any) => {
  const user = await authenticateUser(event)
  
  // Fetch user profile to check role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('[Auth] Failed to fetch user profile:', error)
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied'
    })
  }

  if (!['admin', 'manager'].includes(profile.role)) {
    console.error('[Auth] User is not manager:', user.id)
    throw createError({
      statusCode: 403,
      statusMessage: 'Manager access required'
    })
  }
  
  return user
}

// ============ JWT UTILITIES ============

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

/**
 * Create JWT token
 */
export const createJWT = (payload: any, expiresIn: string = '7d') => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
  } catch (error: any) {
    console.error('[JWT] Failed to create token:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create authentication token'
    })
  }
}

/**
 * Verify JWT token
 */
export const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error: any) {
    console.error('[JWT] Failed to verify token:', error)
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }
}

// ============ USER UTILITIES ============

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Failed to fetch user profile:', error)
      throw createError({
        statusCode: 404,
        statusMessage: 'User profile not found'
      })
    }

    return profile
  } catch (error: any) {
    console.error('[Auth] Error fetching user profile:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Auth] Failed to update user profile:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update user profile'
      })
    }

    return profile
  } catch (error: any) {
    console.error('[Auth] Error updating user profile:', error)
    throw error
  }
}

/**
 * Check if user exists
 */
export const userExists = async (email: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Auth] Error checking user existence:', error)
      throw error
    }

    return !!profile
  } catch (error: any) {
    console.error('[Auth] Error checking user existence:', error)
    return false
  }
}

// ============ RESPONSE UTILITIES ============

/**
 * Standard success response
 */
export const successResponse = (data: any, message: string = 'Success') => {
  return {
    success: true,
    statusMessage: message,
    data
  }
}

/**
 * Standard error response
 */
export const errorResponse = (statusCode: number, statusMessage: string) => {
  throw createError({
    statusCode,
    statusMessage
  })
}

// ============ VALIDATION UTILITIES ============

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters
  if (password.length < 8) return false
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) return false
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) return false
  
  // At least one number
  if (!/[0-9]/.test(password)) return false
  
  return true
}

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  // 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

// ============ LOGGING UTILITIES ============

/**
 * Log authentication event
 */
export const logAuthEvent = (event: string, userId: string, details: any = {}) => {
  console.log(`[Auth Event] ${event}`, {
    userId,
    timestamp: new Date().toISOString(),
    ...details
  })
}

/**
 * Log error event
 */
export const logErrorEvent = (event: string, error: any, details: any = {}) => {
  console.error(`[Auth Error] ${event}`, {
    error: error.message || error,
    timestamp: new Date().toISOString(),
    ...details
  })
}
